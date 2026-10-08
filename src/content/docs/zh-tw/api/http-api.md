---
title: Mankai 相容 API
description: 實作 Mankai HTTP 外掛模組呼叫的相容伺服器 API，提供認證、漫畫、章節圖片、書庫更新檢查、搜尋與搜尋建議。
---

要讓 [Mankai](https://github.com/mankai-app/mankai) 的 HTTP 外掛模組與你的伺服器互動，伺服器必須實作下方定義的相容 API。伺服器支援的操作應使用本規範規定的端點路徑、請求內文和回應格式。

使用者在**設定 → 來源**中新增 **Mankai 相容**來源來連接伺服器。應用程式設定步驟請參閱[新增來源](/zh-tw/guides/sources/#新增來源)。

如果還需要支援應用程式內編輯器，請同時遵循[編輯器 API 規範](/zh-tw/api/editor-api/)。

<span id="server-information"></span>

## 伺服器資訊

### `GET /`

取得伺服器資訊。

**回應 — `200 OK`**

```ts
interface ServerInfoResponse {
  id: string
  authenticationEnabled: boolean
  editorEnabled?: boolean // default: false
  name?: string
  version?: string
  description?: string
  authors?: string[]
  repository?: string
  availableGenres?: string[]
  cooldown?: Cooldown
  capabilities?: PluginCapability[]
}

interface Cooldown {
  default?: number
  getImage?: number
  getImageConcurrency?: number
}

type PluginCapability =
  | 'onlineCheck'
  | 'suggestions'
  | 'list'
  | 'listByGenre'
  | 'listByStatus'
  | 'search'
  | 'searchByGenre'
  | 'searchByStatus'
  | 'searchByAuthor'
  | 'mangaDetails'
  | 'batchMangas'
  | 'mangaUpdates'
  | 'chapter'
  | 'image'
```

`default` 是外掛模組執行非圖片操作時兩次呼叫之間的最小間隔，以毫秒為單位。`getImage` 單獨設定圖片請求之間的最小間隔。`getImageConcurrency` 可限制並行圖片請求數量。

省略 `capabilities` 時，除 `mangaUpdates` 以外的所有能力都會啟用。只有明確列出 `mangaUpdates` 時才會啟用該能力。

支援 `batchMangas` 或 `mangaUpdates` 的外掛模組可以參與書庫更新檢查。如果需要伺服器透過 `POST /manga/updates` 決定哪些漫畫應標記為有更新，請包含 `mangaUpdates`。省略 `mangaUpdates` 時，Mankai 使用預設行為，呼叫 `POST /manga`、更新回傳的中繼資料並比較回傳的最新章節。預設行為要求支援 `batchMangas`。

<span id="authentication-optional"></span>

## 認證（可選）

若要在伺服器上啟用認證，必須實作以下兩個端點。

用戶端呼叫 `/auth/*` 和 `/` 以外的端點時，會在 `Authorization` 請求標頭中包含 `accessToken`。

### `POST /auth/login`

以使用者名稱和密碼換取存取權杖與更新權杖。

**請求內文**

```ts
interface LoginRequest {
  username: string
  password: string
}
```

**回應 — `200 OK`**

```ts
interface LoginResponse {
  message: string
  user: {
    // User Details (Optional)
  }
  accessToken: string
  refreshToken: string
}
```

### `POST /auth/refresh`

使用有效的更新權杖換取新的存取權杖。

**請求內文**

```ts
interface RefreshRequest {
  refreshToken: string
}
```

**回應 — `200 OK`**

```ts
interface RefreshResponse {
  message: string
  accessToken: string
}
```

<span id="manga"></span>

## 漫畫

這些端點回傳漫畫及其章節的資料。用於清單、搜尋和批次查詢的輕量漫畫條目共用下方定義的 `Manga` 結構，完整詳細資訊端點回傳資訊更豐富的 `MangaResponse` 結構。

### `GET /manga`

取得分頁漫畫清單，可按類型、狀態或兩者進行篩選。

**查詢參數**

| 參數     | 類型     | 預設值      | 必填 | 說明                                                 |
| :------- | :------- | :---------- | :--- | :--------------------------------------------------- |
| `page`   | `number` | `1`         | 否   | 要取得的頁碼。                                       |
| `genre`  | `string` | `"all"`     | 否   | 依單一漫畫類型篩選結果。                             |
| `status` | `number` | `0`（全部） | 否   | 按狀態篩選，`0` = 全部，`1` = 連載中，`2` = 已完結。 |

**回應 — `200 OK`**

```ts
type MangaListResponse = Manga[]

interface Chapter {
  id: string
  title?: string
  locked?: boolean
}

interface Manga {
  id: string
  title?: string
  cover?: string // URL — absolute, or relative to the server's base URL
  status?: Status
  latestChapter?: Chapter
}

enum Status {
  Any = 0,
  OnGoing = 1,
  Completed = 2,
}
```

### `POST /manga`

取得指定漫畫清單的輕量詳細資訊。適用於更新使用者書庫等批次查詢場景，避免逐條呼叫 `GET /manga/:id` 導致速度過慢。

**請求內文**

```ts
type MangaRequest = string[] // Array of manga IDs
```

**回應 — `200 OK`**

回傳與 [`GET /manga`](#get-manga) 相同的 `MangaListResponse` 結構。

### `POST /manga/updates`

根據 Mankai 目前已知的最新章節批次檢查漫畫更新。

此端點讓伺服器控制更新行為。如果希望使用 Mankai 預設的批次比較方式，請省略 `mangaUpdates` 能力。

**請求內文**

```ts
interface MangaUpdateRequest {
  id: string
  latestChapter: Chapter
}

type MangaUpdatesRequest = MangaUpdateRequest[]
```

**回應 — `200 OK`**

回傳 `MangaUpdate[]`。每個結果必須包含 `id` 和 `updates`。Mankai 僅根據 `updates` 的值決定是否將已儲存的漫畫標記為有更新。Mankai 會根據所有回傳結果更新中繼資料，包括 `updates` 為 `false` 的結果。

其餘屬性用於局部更新。Mankai 只將非 `null` 屬性套用到現有的本機漫畫快照。省略或設為 `null` 的屬性會保留現有值。只有 `updates` 為 `true` 時，Mankai 才會將 `latestChapter` 儲存為下次檢查更新的比較基準。回應中未包含的漫畫保持不變。

```ts
interface MangaUpdate extends Manga {
  updates: boolean
}

type MangaUpdatesResponse = MangaUpdate[]
```

```json
[
  {
    "id": "one-piece",
    "updates": true,
    "latestChapter": {
      "id": "1124",
      "title": "Chapter 1124"
    }
  },
  {
    "id": "completed-series",
    "updates": false,
    "status": 2
  }
]
```

### `GET /manga/:id`

取得單部漫畫的完整詳細資訊，包括簡介、作者、類型，以及按章節組組織的完整章節清單。`chapters` 中條目的順序決定章節組的顯示順序。同一漫畫中的章節組標題必須唯一。

**路徑參數**

| 參數 | 類型     | 說明      |
| :--- | :------- | :-------- |
| `id` | `string` | 漫畫 ID。 |

**回應 — `200 OK`**

```ts
interface MangaResponse {
  id: string
  title?: string
  cover?: string // URL — absolute, or relative to the server's base URL
  status?: Status
  readingDirection?: ReadingDirection
  latestChapter?: Chapter
  description?: string
  externalLink?: string
  updatedAt?: number // Unix timestamp in milliseconds
  authors: string[]
  genres: Genre[]
  chapters: ChapterGroup[] // Ordered from first group to last group
  remarks?: string
  editable?: boolean // Whether this manga can be edited, defaults to true
}

enum Genre {
  All = 'all',
  Action = 'action',
  Romance = 'romance',
  Yuri = 'yuri',
  BoysLove = 'boysLove',
  SchoolLife = 'schoolLife',
  Adventure = 'adventure',
  Harem = 'harem',
  SpeculativeFiction = 'speculativeFiction',
  War = 'war',
  Suspense = 'suspense',
  FanFiction = 'fanFiction',
  Comedy = 'comedy',
  Magic = 'magic',
  Horror = 'horror',
  Historical = 'historical',
  Sports = 'sports',
  Mature = 'mature',
  Mecha = 'mecha',
  Otokonoko = 'otokonoko',
}

enum Status {
  Any = 0,
  OnGoing = 1,
  Completed = 2,
}

enum ReadingDirection {
  LeftToRight = 1,
  RightToLeft = 2,
  Vertical = 3,
}

interface Chapter {
  id: string
  title?: string
  locked?: boolean
}

interface ChapterGroup {
  id?: string // Required for editable manga, Read-only plugins may omit it
  title: string // Unique within this manga
  chapters: Chapter[] // Increasing order: oldest/lowest chapter first
}
```

### `GET /manga/:id/chapter/:chapterId`

取得指定章節的頁面圖片。回應是圖片網址清單，可以使用絕對網址或相對於伺服器基礎網址的相對網址。

**路徑參數**

| 參數        | 類型     | 說明      |
| :---------- | :------- | :-------- |
| `id`        | `string` | 漫畫 ID。 |
| `chapterId` | `string` | 章節 ID。 |

**回應 — `200 OK`**

```ts
// Array of image URLs (absolute, or relative to the server's base URL).
type ChapterResponse = string[]
```

<span id="search"></span>

## 搜尋

### `GET /search`

按標題或作者搜尋漫畫。

**查詢參數**

| 參數       | 類型      | 預設值      | 必填 | 說明                                                 |
| :--------- | :-------- | :---------- | :--- | :--------------------------------------------------- |
| `query`    | `string`  | `null`      | 是   | 搜尋查詢字串。                                       |
| `page`     | `number`  | `1`         | 否   | 要取得的頁碼。                                       |
| `genre`    | `string`  | `"all"`     | 否   | 依單一漫畫類型篩選結果。                             |
| `status`   | `number`  | `0`（全部） | 否   | 按狀態篩選，`0` = 全部，`1` = 連載中，`2` = 已完結。 |
| `isAuthor` | `boolean` | `false`     | 否   | 搜尋作者欄位而不是標題欄位。                         |

**回應 — `200 OK`**

回傳與 [`GET /manga`](#get-manga) 相同的 `MangaListResponse` 結構。

<span id="suggestion"></span>

## 搜尋建議

### `GET /suggestion`

取得搜尋字詞的自動完成建議，通常用於搜尋欄中的輸入建議。

**查詢參數**

| 參數    | 類型     | 預設值 | 必填 | 說明                     |
| :------ | :------- | :----- | :--- | :----------------------- |
| `query` | `string` | `null` | 是   | 需要取得建議的查詢字串。 |

**回應 — `200 OK`**

```ts
// Array of suggested manga titles.
type SuggestionResponse = string[]
```
