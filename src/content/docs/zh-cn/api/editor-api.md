---
title: 编辑器 API
description: 支持 Mankai 应用内编辑器的漫画、章节组、章节和图片管理 API。
---

本规范说明服务器为支持 [Mankai](https://github.com/mankai-app/mankai) 应用内编辑器而必须实现的端点。

阅读前请先熟悉 [Mankai 兼容 API 规范](/zh-cn/api/http-api/)。本文引用的所有共享类型，如 `Manga`、`Chapter`、`Status` 和 `Genre`，都在该规范中定义。

<span id="manga-management"></span>

## 漫画管理

### `POST /edit/manga`

新增或更新漫画条目。如果请求体省略 `id` 字段，服务器应生成新 ID。否则更新该 ID 对应的现有漫画。

**请求体**

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

**响应 — `200 OK`**

```ts
interface MangaResponse {
  id: string
}
```

### `DELETE /edit/manga/:id`

删除漫画及其所有关联的章节组、章节和图片。

**路径参数**

| 参数 | 类型     | 说明      |
| :--- | :------- | :-------- |
| `id` | `string` | 漫画 ID。 |

### `POST /edit/manga/:id/cover`

新增或更新漫画封面。请求体应为原始图片字节，服务器应根据请求的 `Content-Type` 标头推断格式，例如 `image/png` 或 `image/jpeg`。

**路径参数**

| 参数 | 类型     | 说明      |
| :--- | :------- | :-------- |
| `id` | `string` | 漫画 ID。 |

**请求体**

原始图片数据，例如 `image/png` 或 `image/jpeg`。

<span id="chapter-group-management"></span>

## 章节组管理

章节组是带名称的相关章节集合，例如“第一季”或由同一汉化组提供的章节。

:::note[可编辑章节组的 ID]

对于可编辑漫画，`GET /manga/:id` 返回的每个章节组都必须包含 `id`。应用使用此 ID 执行更新和删除操作。只读实现可以省略章节组 ID。

:::

### `POST /edit/chapter-group`

新增或更新章节组。省略 `id` 可创建新组，否则更新该 ID 对应的现有组。

**请求体**

```ts
interface ChapterGroupRequest {
  id?: string // Omit to create a new chapter group.
  mangaId: string
  title: string
}
```

### `DELETE /edit/chapter-group/:id`

删除章节组及其所有章节和图片。

**路径参数**

| 参数 | 类型     | 说明        |
| :--- | :------- | :---------- |
| `id` | `string` | 章节组 ID。 |

### `GET /edit/chapter-group/:id/chapters`

获取属于指定章节组的有序章节列表。

**路径参数**

| 参数 | 类型     | 说明        |
| :--- | :------- | :---------- |
| `id` | `string` | 章节组 ID。 |

**响应 — `200 OK`**

```ts
type ChaptersResponse = Chapter[]

interface Chapter {
  id: string
  title?: string
  locked?: boolean
}
```

<span id="chapter-management"></span>

## 章节管理

### `POST /edit/chapter`

新增或更新章节。省略 `id` 可创建新章节，否则更新该 ID 对应的现有章节。

**请求体**

```ts
interface ChapterUpsertRequest {
  id?: string // Omit to create a new chapter.
  title: string
  chapterGroupId: string
}
```

### `DELETE /edit/chapter/:id`

删除章节及其所有关联图片。

**路径参数**

| 参数 | 类型     | 说明      |
| :--- | :------- | :-------- |
| `id` | `string` | 章节 ID。 |

### `POST /edit/chapter/order`

设置章节组内的章节顺序。请求体是有序的章节 ID 列表，第一个 ID 对应第一章，第二个对应第二章，依此类推。

**请求体**

```ts
type ChapterOrderRequest = string[] // Ordered list of chapter IDs
```

### `POST /edit/chapter/:id/images`

在章节末尾追加图片。`images` 数组中的每一项都应为 Base64 编码的图片。

**路径参数**

| 参数 | 类型     | 说明      |
| :--- | :------- | :-------- |
| `id` | `string` | 章节 ID。 |

**请求体**

```ts
interface ChapterImagesRequest {
  images: string[] // Array of image data, each encoded in base64.
}
```

### `POST /edit/images/delete`

通过完整网址删除一张或多张图片。适用于移除章节页面或清理未被引用的图片。

**请求体**

```ts
type DeleteImagesRequest = string[] // List of image URLs to delete.
```

### `POST /edit/images/order`

设置章节内的图片顺序。请求体是有序的图片网址列表，第一个网址对应第一张图片，第二个对应第二张，依此类推。

**请求体**

```ts
type ImageOrderRequest = string[] // Ordered list of image URLs.
```
