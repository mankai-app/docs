---
title: Editor API
description: The optional HTTP endpoints for editing manga, chapter groups, chapters, covers, and page images.
sidebar:
  order: 4
---

Implement these endpoints to support the in-app editor in [Mankai](https://github.com/mankai-app/mankai).

This API extends the [Mankai Compatible API](/api/http-api/), which defines shared types such as `Manga`, `Chapter`, `Status`, and `Genre`.

## Manga management

### `POST /edit/manga`

Insert or update a manga entry. If the request body's `id` field is omitted, the server should generate a new ID. Otherwise, update the existing manga with that ID.

**Request body**

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

**Response — `200 OK`**

```ts
interface MangaResponse {
  id: string
}
```

### `DELETE /edit/manga/:id`

Delete a manga and all of its associated chapter groups, chapters, and images.

**Path parameters**

| Parameter | Type     | Description     |
| :-------- | :------- | :-------------- |
| `id`      | `string` | The manga's ID. |

### `POST /edit/manga/:id/cover`

Insert or update the cover image for a manga. Send the raw image bytes in the request body. The server should infer the format from the request's `Content-Type` header, such as `image/png` or `image/jpeg`.

**Path parameters**

| Parameter | Type     | Description     |
| :-------- | :------- | :-------------- |
| `id`      | `string` | The manga's ID. |

**Request body**

Raw image data, such as PNG or JPEG.

## Chapter group management

A chapter group is a named container for a set of related chapters (for example, a "Season 1" group, or chapters belonging to the same scanlation team).

For editable manga, every chapter group returned by `GET /manga/:id` must include its `id`. The app uses this ID for update and delete operations. Read-only implementations may omit chapter group IDs.

### `POST /edit/chapter-group`

Insert or update a chapter group. Omit `id` to create a new group. Otherwise, update the existing group with that ID.

**Request body**

```ts
interface ChapterGroupRequest {
  id?: string // Omit to create a new chapter group.
  mangaId: string
  title: string
}
```

### `DELETE /edit/chapter-group/:id`

Delete a chapter group and all of its chapters and images.

**Path parameters**

| Parameter | Type     | Description             |
| :-------- | :------- | :---------------------- |
| `id`      | `string` | The chapter group's ID. |

### `GET /edit/chapter-group/:id/chapters`

Retrieve the ordered list of chapters that belong to a chapter group.

**Path parameters**

| Parameter | Type     | Description             |
| :-------- | :------- | :---------------------- |
| `id`      | `string` | The chapter group's ID. |

**Response — `200 OK`**

```ts
type ChaptersResponse = Chapter[]

interface Chapter {
  id: string
  title?: string
  locked?: boolean
}
```

## Chapter management

### `POST /edit/chapter`

Insert or update a chapter. Omit `id` to create a new chapter. Otherwise, update the existing chapter with that ID.

**Request body**

```ts
interface ChapterUpsertRequest {
  id?: string // Omit to create a new chapter.
  title: string
  chapterGroupId: string
}
```

### `DELETE /edit/chapter/:id`

Delete a chapter and all of its associated images.

**Path parameters**

| Parameter | Type     | Description       |
| :-------- | :------- | :---------------- |
| `id`      | `string` | The chapter's ID. |

### `POST /edit/chapter/order`

Set the order of chapters within a chapter group. The request body is an ordered list of chapter IDs — the first ID becomes the first chapter, the second becomes the second, and so on.

**Request body**

```ts
type ChapterOrderRequest = string[] // Ordered list of chapter IDs
```

### `POST /edit/chapter/:id/images`

Append images to the end of a chapter. Each entry in the `images` array should be a base64-encoded image.

**Path parameters**

| Parameter | Type     | Description       |
| :-------- | :------- | :---------------- |
| `id`      | `string` | The chapter's ID. |

**Request body**

```ts
interface ChapterImagesRequest {
  images: string[] // Array of image data, each encoded in base64.
}
```

### `POST /edit/images/delete`

Delete one or more images by their full URLs. Use this when removing pages from a chapter or cleaning up orphaned images.

**Request body**

```ts
type DeleteImagesRequest = string[] // List of image URLs to delete.
```

### `POST /edit/images/order`

Set the order of images within a chapter. The request body is an ordered list of image URLs — the first URL becomes the first image, the second becomes the second, and so on.

**Request body**

```ts
type ImageOrderRequest = string[] // Ordered list of image URLs.
```
