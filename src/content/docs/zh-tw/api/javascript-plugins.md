---
title: JavaScript 外掛模組
description: Mankai JavaScript 外掛模組的清單、回呼、資料類型與執行階段 API 完整參考。
---

本規範說明為 [Mankai](https://github.com/mankai-app/mankai) 提供線上漫畫內容的外掛模組所使用的 JSON 格式和 JavaScript API。

JavaScript 外掛模組是唯讀內容源。應用程式從網址或貼上的 JSON 載入清單，然後在隱藏的 WebKit 網頁視圖中執行回呼腳本。請僅安裝可信的外掛模組，因為外掛模組可以在應用程式的外掛模組執行環境中發起網路請求並執行任意 JavaScript 程式碼。

<span id="manifest"></span>

## 清單

清單是一個 JSON 物件。解碼器只要求提供 `id` 欄位，但仍需提供實際使用的操作所要求的回呼腳本。

```ts
type ScriptName =
  | 'isOnline'
  | 'getSuggestion'
  | 'search'
  | 'getList'
  | 'getMangas'
  | 'getMangaUpdates'
  | 'getDetailedManga'
  | 'getChapter'
  | 'getImage'

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

interface JsPluginManifest {
  id: string
  name?: string
  version?: string
  description?: string
  authors?: string[]
  repository?: string
  updatesUrl?: string
  availableGenres?: Genre[]
  scripts?: Record<ScriptName, string>
  configs?: Config[]
  getImageHeaders?: Record<string, string>
  cooldown?: Cooldown
  capabilities?: PluginCapability[]
}
```

<span id="metadata-fields"></span>

### 中繼資料欄位

| 欄位              | 類型                     | 說明                                                                              |
| :---------------- | :----------------------- | :-------------------------------------------------------------------------------- |
| `id`              | `string`                 | 穩定且全域唯一的外掛模組識別碼，也用於劃分永久儲存的範圍。                        |
| `name`            | `string`                 | 顯示名稱，省略時使用 ID。                                                         |
| `version`         | `string`                 | 在應用程式中顯示並用於檢查更新的外掛模組版本。                                    |
| `description`     | `string`                 | 在外掛模組設定中顯示的簡短描述。                                                  |
| `authors`         | `string[]`               | 外掛模組作者，預設值為 `[]`。                                                     |
| `repository`      | `string`                 | 原始碼或專案的網址。                                                              |
| `updatesUrl`      | `string`                 | 用於檢查更新的清單網址。                                                          |
| `availableGenres` | `Genre[]`                | 內容源支援的漫畫類型，預設值為 `[]`。                                             |
| `scripts`         | `Record<string, string>` | 以以下腳本名稱為鍵的 JavaScript 原始碼，未知的鍵會被忽略。                        |
| `configs`         | `Config[]`               | 使用者可調整並供腳本讀取的設定值，預設值為 `[]`。                                 |
| `getImageHeaders` | `Record<string, string>` | 如果存在，Mankai 使用這些原生請求標頭下載所有圖片網址，而不呼叫 `getImage` 腳本。 |
| `cooldown`        | `Cooldown`               | 可選的請求節流和圖片並行限制。                                                    |
| `capabilities`    | `PluginCapability[]`     | 外掛模組支援的操作，預設啟用除 `mangaUpdates` 以外的所有能力。                    |

<span id="script-format"></span>

### 腳本格式

每個腳本值都是包含函式和匯出標記的字串。

<!-- prettier-ignore -->
```js
async function isOnline() {
  const response = await fetch('https://example.com/')
  return response.ok
}

export{isOnline as default};
```

標記必須使用 `export{functionName as default};` 的形式。Mankai 在執行前移除該標記並呼叫指定函式。函式可以是同步或非同步函式，Mankai 會等待回傳結果。除了匯出的函式，腳本還可以包含輔助函式。

清單剖析器不會拒絕缺少腳本的清單，但呼叫缺失的回呼會在執行階段失敗。外掛模組應提供所宣告能力對應的回呼，也可以使用 `getImageHeaders` 替代 `getImage`。

<span id="callback-scripts"></span>

## 回呼腳本

可選欄位 `capabilities` 接受下列值。省略時，除 `mangaUpdates` 以外的所有能力都會啟用。外掛模組可以使用此欄位宣告自己實作的操作，讓應用程式避免呼叫不支援的回呼。

```text
onlineCheck, suggestions, list, listByGenre, listByStatus, search, searchByGenre, searchByStatus, searchByAuthor, mangaDetails, batchMangas, mangaUpdates, chapter, image
```

支援 `batchMangas` 或 `mangaUpdates` 的外掛模組可以參與書庫更新檢查。如果需要外掛模組透過專用的 `getMangaUpdates` 回呼決定哪些漫畫應標記為有更新，請包含 `mangaUpdates`。省略 `mangaUpdates` 時，Mankai 使用預設行為，呼叫 `getMangas`、更新回傳的中繼資料並比較回傳的最新章節。預設行為要求支援 `batchMangas`。

鍵與函式簽名如下。

| 鍵                 | 函式簽名                                       | 回傳值                                     |
| :----------------- | :--------------------------------------------- | :----------------------------------------- |
| `isOnline`         | `isOnline()`                                   | `boolean`                                  |
| `getSuggestion`    | `getSuggestion(query)`                         | `string[]`                                 |
| `search`           | `search(query, page, genre, status, isAuthor)` | `Manga[]`                                  |
| `getList`          | `getList(page, genre, status)`                 | `Manga[]`                                  |
| `getMangas`        | `getMangas(ids)`                               | `Manga[]`                                  |
| `getMangaUpdates`  | `getMangaUpdates(mangas)`                      | `MangaUpdate[]` 中繼資料局部更新與更新標記 |
| `getDetailedManga` | `getDetailedManga(id)`                         | `DetailedManga`                            |
| `getChapter`       | `getChapter(manga, chapter)`                   | 圖片網址陣列 `string[]`                    |
| `getImage`         | `getImage(url)`                                | Base64 圖片資料或圖片代理請求物件          |

以下說明各參數與回傳結果。

### `isOnline`

當內容源可存取且可用時回傳 `true`，否則回傳 `false`。拋出例外或回傳非布林值會被視為外掛模組呼叫失敗。

### `getSuggestion(query)`

回傳適合用作搜尋建議的字串陣列。清單中的鍵使用單數形式 `getSuggestion`。

<!-- prettier-ignore -->
```js
async function getSuggestion(query) {
  const response = await fetch(
    `https://example.com/suggestions?q=${encodeURIComponent(query)}`,
  )
  if (!response.ok) return []
  return await response.json()
}

export{getSuggestion as default};
```

### `search(query, page, genre, status, isAuthor)`

按標題或作者搜尋漫畫。`page` 是從 1 開始的頁碼。`genre` 是[漫畫類型](#genres)中的一個字串，`status` 是[狀態](#statuses)中的一個數值。當 `isAuthor` 為 `true` 時，搜尋內容源的作者欄位而不是標題欄位。回傳輕量的 `Manga` 物件陣列。

### `getList(page, genre, status)`

回傳內容源的分頁清單，使用與 `search` 相同的 `page`、`genre` 和 `status` 參數。

### `getMangas(ids)`

根據請求的字串 ID 回傳輕量漫畫物件。如果內容源已不再包含某些 ID，回傳的條目數可以少於請求數。

### `getMangaUpdates(mangas)`

每個請求條目包含漫畫 ID 和 Mankai 目前已知的最新章節。此回呼讓外掛模組控制更新行為。如果希望使用 Mankai 預設的批次比較方式，請省略 `mangaUpdates` 能力。

```ts
interface MangaUpdateRequest {
  id: string
  latestChapter: Chapter
}
```

回傳 `MangaUpdate[]`。每個結果必須包含 `id` 和 `updates`。Mankai 僅根據 `updates` 的值決定是否將已儲存的漫畫標記為有更新。Mankai 會根據所有回傳結果更新中繼資料，包括 `updates` 為 `false` 的結果。

其餘屬性用於局部更新。Mankai 只將非 `null` 屬性套用到現有的本機漫畫快照。省略或設為 `null` 的屬性會保留現有值。只有 `updates` 為 `true` 時，Mankai 才會將 `latestChapter` 儲存為下次檢查更新的比較基準。回應中未包含的漫畫保持不變。

```ts
interface MangaUpdate extends Manga {
  updates: boolean
}
```

<!-- prettier-ignore -->
```js
async function getMangaUpdates(mangas) {
  const response = await fetch('https://example.com/manga/updates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mangas),
  })
  if (!response.ok) return []
  return await response.json()
}

export{getMangaUpdates as default};
```

例如，外掛模組可以回傳 `{ id: "completed-series", updates: false, status: 2 }`，只更新狀態而不顯示未讀更新。

### `getDetailedManga(id)`

回傳完整的 `DetailedManga` 物件。Mankai 會先將回傳值序列化為 JSON 再解碼，因此應回傳 JavaScript 物件，而不是 JSON 字串。

### `getChapter(manga, chapter)`

按順序回傳 `chapter` 的圖片網址。`manga` 參數是 `getDetailedManga` 回傳的完整物件，`chapter` 是所選章節物件。圖片網址應為絕對網址，因為 Mankai 隨後會逐一將其傳入 `getImage`。

<!-- prettier-ignore -->
```js
async function getChapter(manga, chapter) {
  const response = await fetch(
    `https://example.com/manga/${encodeURIComponent(manga.id)}/chapter/${encodeURIComponent(chapter.id)}`,
  )
  if (!response.ok) return []
  return await response.json()
}

export{getChapter as default};
```

### `getImage(url)`

未提供 `getImageHeaders` 時，Mankai 對封面和章節頁面呼叫此腳本。接受以下兩種結果。

1. 包含原始圖片位元組的 Base64 字串，不要包含 `data:image/...;base64,` 前綴。
2. 指示 Mankai 發起原生請求的物件。

   ```ts
   interface ImageProxyRequest {
     url: string
     headers: Record<string, string>
   }
   ```

例如：

<!-- prettier-ignore -->
```js
async function getImage(url) {
  return {
    url,
    headers: {
      Referer: 'https://example.com/',
      'User-Agent': 'Mozilla/5.0',
    },
  }
}

export{getImage as default};
```

如果清單包含 `getImageHeaders`，系統會自動對每個圖片網址發起等效的原生請求。

```json
{
  "getImageHeaders": {
    "Referer": "https://example.com/",
    "User-Agent": "Mozilla/5.0"
  }
}
```

此模式優先於 `getImage` 腳本，請求標頭同時適用於封面和章節頁面。

<span id="data-types"></span>

## 資料類型

回呼結果接受以下結構，可選屬性可以省略。

```ts
interface Chapter {
  id: string
  title?: string
  locked?: boolean
}

interface Manga {
  id: string
  title?: string
  cover?: string
  status?: Status
  latestChapter?: Chapter
  meta?: string
}

interface ChapterGroup {
  id?: string
  title: string
  chapters: Chapter[]
}

interface DetailedManga {
  id: string
  title?: string
  cover?: string
  status?: Status
  readingDirection?: ReadingDirection
  latestChapter?: Chapter
  description?: string
  externalLink?: string
  updatedAt?: number // Unix timestamp in milliseconds
  authors?: string[]
  genres?: Genre[]
  chapters?: ChapterGroup[]
  remarks?: string
  meta?: string
}
```

漫畫詳細資訊中省略的 `authors`、`genres` 和 `chapters` 預設為空陣列。

<span id="genres"></span>

### 漫畫類型

Mankai 識別以下字串值。

```text
all, action, romance, yuri, boysLove, otokonoko, schoolLife, adventure,
harem, speculativeFiction, war, suspense, fanFiction, comedy, magic, horror,
historical, sports, mature, mecha
```

<span id="statuses"></span>

### 狀態

| 名稱        | 值  |
| :---------- | :-- |
| `any`       | `0` |
| `onGoing`   | `1` |
| `completed` | `2` |

<span id="reading-directions"></span>

### 閱讀方向

| 名稱          | 值  |
| :------------ | :-- |
| `leftToRight` | `1` |
| `rightToLeft` | `2` |
| `vertical`    | `3` |

<span id="runtime-helpers"></span>

## 執行階段輔助函式

Mankai 在每個回呼腳本中注入以下輔助函式。

### `fetch(url, options)`

執行環境提供使用原生網路的 `fetch` 實作，支援以下請求選項。

```ts
interface FetchOptions {
  method?: string // Defaults to "GET"
  headers?: Record<string, string> | Headers
  body?: string
}
```

回傳的回應具有以下屬性和方法。

```ts
interface FetchResponse {
  ok: boolean
  status: number
  statusText: string
  url: string
  headers: Headers
  text(): Promise<string>
  json(): Promise<any>
  blob(): Promise<Blob>
  arrayBuffer(): Promise<ArrayBuffer>
}
```

非 2xx 回應會正常完成，此時 `ok === false`，請使用 `ok` 或 `status` 處理。網路錯誤和無效網址會使 Promise 進入拒絕狀態。請求內文與回應內文透過原生橋接傳輸，因此當回應是二進位內容時請使用 `arrayBuffer()`。

### `console.log(...values)`

`console.log` 的輸出會寫入 Mankai 的 JavaScript 外掛模組日誌，可用於開發期間診斷外掛模組。

```js
console.log('searching', query)
```

<span id="s2ttext-and-t2stext"></span>

### `s2t(text)` 與 `t2s(text)`

這些非同步輔助函式使用 OpenCC 轉換中文文字。

```js
const traditional = await s2t('简体转繁体')
const simplified = await t2s('繁體轉簡體')
```

`s2t` 將簡體中文轉換為繁體中文，`t2s` 執行反向轉換。

### `getConfigs()`

以陣列形式回傳清單所宣告的設定項目的目前值。

```ts
interface ConfigValue {
  key: string
  value: unknown
}
```

範例：

```js
function configValue(key) {
  return getConfigs().find((config) => config.key === key)?.value
}

const username = configValue('username')
```

<span id="persistent-storage"></span>

### 永久儲存

這些輔助函式在以外掛模組 `id` 為範圍的鍵值儲存中儲存字串值。

```ts
getValue(key: string): Promise<string | null>;
setValue(key: string, value: string): Promise<void>;
removeValue(key: string): Promise<boolean>;
```

三個輔助函式都應使用 `await`。應用程式重啟和外掛模組更新後，值仍然保留。刪除外掛模組時，這些值也會刪除。

```js
const token = await getValue('token')
if (!token) {
  await setValue('token', 'new-token')
}
await removeValue('temporary-value')
```

<span id="configuration"></span>

## 設定

設定項目採用以下結構。

```ts
interface Config {
  key: string
  name: string
  description?: string
  type:
    'text' | 'password' | 'number' | 'slider' | 'boolean' | 'select' | 'color'
  defaultValue: unknown
  options?: string[]
  min?: number
  max?: number
  step?: number
  supportsOpacity?: boolean
}
```

`color` 設定使用 sRGB 十六進位字串。預設情況下，顏色選擇器不支援透明度，並儲存大寫的 `#RRGGBB` 值，例如 `"#F2E4C9"`。將 `supportsOpacity` 設為 `true` 可啟用不透明度控制並儲存 `#RRGGBBAA` 值。輸入時可以省略開頭的 `#`。

`options` 用於 `select` 設定。`min`、`max` 和 `step` 指定 `slider` 設定的範圍和步長。應用程式使用 `defaultValue` 初始化每個設定項目，持久儲存使用者在外掛模組設定中的修改，並透過 `getConfigs()` 提供目前值。

範例：

```json
{
  "configs": [
    {
      "key": "language",
      "name": "Language",
      "description": "Language used when requesting titles.",
      "type": "select",
      "defaultValue": "en",
      "options": ["en", "zh-Hans", "zh-Hant"]
    },
    {
      "key": "imageQuality",
      "name": "Image quality",
      "type": "slider",
      "defaultValue": 80,
      "min": 10,
      "max": 100,
      "step": 5
    },
    {
      "key": "includeMature",
      "name": "Include mature content",
      "type": "boolean",
      "defaultValue": false
    }
  ]
}
```

從網址匯入外掛模組時，相符的查詢參數會覆蓋宣告的預設值。值按照 `type` 解析。布林值識別 `true` 和 `1`，數字和滑桿值解析為整數或小數，文字、密碼、選擇和顏色值在去除兩端空白後保留為字串。

<span id="cooldowns"></span>

## 冷卻時間

冷卻時間以毫秒為單位。

```ts
interface Cooldown {
  default?: number
  getImage?: number
  getImageConcurrency?: number
}
```

| 欄位                  | 說明                                                       |
| :-------------------- | :--------------------------------------------------------- |
| `default`             | 搜尋、清單、詳細資訊和章節請求等非圖片操作之間的最小間隔。 |
| `getImage`            | 圖片請求之間的最小間隔，圖片請求與其他操作分開排程。       |
| `getImageConcurrency` | 同時進行的圖片請求數量上限，小於 `1` 的值表示不設定限制。  |

使用這些欄位遵守內容源的請求頻率限制，例如：

```json
{
  "cooldown": {
    "default": 500,
    "getImage": 100,
    "getImageConcurrency": 2
  }
}
```
