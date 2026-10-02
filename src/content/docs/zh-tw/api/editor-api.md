---
title: 編輯器 API
description: 支援 Mankai 應用程式內編輯器的漫畫、章節組、章節和圖片管理 API。
---

本規範說明伺服器為支援 [Mankai](https://github.com/mankai-app/mankai) 應用程式內編輯器而必須實作的端點。

閱讀前請先熟悉 [HTTP API 規範](/zh-tw/api/http-api/)。本文引用的所有共用類型，如 `Manga`、`Chapter`、`Status` 和 `Genre`，都在該規範中定義。

<span id="manga-management"></span>

## 漫畫管理

### `POST /edit/manga`

新增或更新漫畫條目。如果請求內文省略 `id` 欄位，伺服器應產生新 ID。否則更新該 ID 對應的現有漫畫。

**請求內文**

```ts
interface MangaRequest {
  id?: string // Omit for new manga — the server may generate its own ID.
  title?: string
  status?: Status
  description?: string
  authors: string[]
  genres: Genre[]
  remarks?: string
}
```

**回應 — `200 OK`**

```ts
interface MangaResponse {
  id: string
}
```

### `DELETE /edit/manga/:id`

刪除漫畫及其所有關聯的章節組、章節和圖片。

**路徑參數**

| 參數 | 類型     | 說明      |
| :--- | :------- | :-------- |
| `id` | `string` | 漫畫 ID。 |

### `POST /edit/manga/:id/cover`

新增或更新漫畫封面。請求內文應為原始圖片位元組，伺服器應根據請求的 `Content-Type` 標頭推斷格式，例如 `image/png` 或 `image/jpeg`。

**路徑參數**

| 參數 | 類型     | 說明      |
| :--- | :------- | :-------- |
| `id` | `string` | 漫畫 ID。 |

**請求內文**

原始圖片資料，例如 `image/png` 或 `image/jpeg`。

<span id="chapter-group-management"></span>

## 章節組管理

章節組是帶名稱的相關章節集合，例如「第一季」或由同一漢化組提供的章節。

對於可編輯漫畫，`GET /manga/:id` 回傳的每個章節組都必須包含 `id`。應用程式使用此 ID 執行更新和刪除操作。唯讀實作可以省略章節組 ID。

### `POST /edit/chapter-group`

新增或更新章節組。省略 `id` 可建立新組，否則更新該 ID 對應的現有組。

**請求內文**

```ts
interface ChapterGroupRequest {
  id?: string // Omit to create a new chapter group.
  mangaId: string
  title: string
}
```

### `DELETE /edit/chapter-group/:id`

刪除章節組及其所有章節和圖片。

**路徑參數**

| 參數 | 類型     | 說明        |
| :--- | :------- | :---------- |
| `id` | `string` | 章節組 ID。 |

### `GET /edit/chapter-group/:id/chapters`

取得指定章節組的章節清單，依顯示順序排列。

**路徑參數**

| 參數 | 類型     | 說明        |
| :--- | :------- | :---------- |
| `id` | `string` | 章節組 ID。 |

**回應 — `200 OK`**

```ts
type ChaptersResponse = Chapter[]

interface Chapter {
  id: string
  title?: string
  locked?: boolean
}
```

<span id="chapter-management"></span>

## 章節管理

### `POST /edit/chapter`

新增或更新章節。省略 `id` 可建立新章節，否則更新該 ID 對應的現有章節。

**請求內文**

```ts
interface ChapterUpsertRequest {
  id?: string // Omit to create a new chapter.
  title: string
  chapterGroupId: string
}
```

### `DELETE /edit/chapter/:id`

刪除章節及其所有關聯圖片。

**路徑參數**

| 參數 | 類型     | 說明      |
| :--- | :------- | :-------- |
| `id` | `string` | 章節 ID。 |

### `POST /edit/chapter/order`

設定章節組內的章節順序。請求內文是依序排列的章節 ID 清單，第一個 ID 對應第一章，第二個對應第二章，依此類推。

**請求內文**

```ts
type ChapterOrderRequest = string[] // Ordered list of chapter IDs
```

### `POST /edit/chapter/:id/images`

在章節末尾追加圖片。`images` 陣列中的每一項都應為 Base64 編碼的圖片。

**路徑參數**

| 參數 | 類型     | 說明      |
| :--- | :------- | :-------- |
| `id` | `string` | 章節 ID。 |

**請求內文**

```ts
interface ChapterImagesRequest {
  images: string[] // Array of image data, each encoded in base64.
}
```

### `POST /edit/images/delete`

透過完整網址刪除一張或多張圖片。適用於移除章節頁面或清理未被引用的圖片。

**請求內文**

```ts
type DeleteImagesRequest = string[] // List of image URLs to delete.
```

### `POST /edit/images/order`

設定章節內的圖片順序。請求內文是依序排列的圖片網址清單，第一個網址對應第一張圖片，第二個對應第二張，依此類推。

**請求內文**

```ts
type ImageOrderRequest = string[] // Ordered list of image URLs.
```
