---
title: エディター API
description: 漫画、チャプターグループ、チャプター、表紙、ページ画像の編集に対応するための HTTP エンドポイントです。
sidebar:
  order: 4
---

この仕様は、[Mankai](https://github.com/mankai-app/mankai) のアプリ内エディターに対応するため、サーバーに実装する必要があるエンドポイントを説明します。

> 先に [Mankai 互換 API](/ja/api/http-api/)を確認してください。ここで参照する共通の型（`Manga`、`Chapter`、`Status`、`Genre` など）は、その仕様で定義されています。

## 漫画の管理

### `POST /edit/manga`

漫画を追加または更新します。リクエストボディの `id` を省略した場合は、サーバーが新しい ID を生成してください。指定した場合は、その ID の既存の漫画を更新します。

**リクエストボディ**

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

**レスポンス — `200 OK`**

```ts
interface MangaResponse {
  id: string
}
```

### `DELETE /edit/manga/:id`

漫画と、それに関連するすべてのチャプターグループ、チャプター、画像を削除します。

**パスパラメーター**

| パラメーター | 型       | 説明             |
| :----------- | :------- | :--------------- |
| `id`         | `string` | 漫画の ID です。 |

### `POST /edit/manga/:id/cover`

漫画の表紙画像を追加または更新します。リクエストボディには画像の生のバイト列を使用してください。サーバーは、リクエストの `Content-Type` ヘッダー（`image/png`、`image/jpeg` など）から画像形式を判断してください。

**パスパラメーター**

| パラメーター | 型       | 説明             |
| :----------- | :------- | :--------------- |
| `id`         | `string` | 漫画の ID です。 |

**リクエストボディ**

画像の生データです（`image/png`、`image/jpeg` など）。

## チャプターグループの管理

チャプターグループは、関連するチャプターを名前を付けてまとめたものです。たとえば「シーズン 1」というグループを作ったり、同じ翻訳チームが担当したチャプターをまとめたりできます。

編集可能な漫画では、`GET /manga/:id` が返すすべてのチャプターグループに `id` を含める必要があります。アプリは更新と削除にこの ID を使用します。読み取り専用の実装では、チャプターグループの ID を省略できます。

### `POST /edit/chapter-group`

チャプターグループを追加または更新します。新しいグループを作成する場合は `id` を省略してください。指定した場合は、その ID の既存のグループを更新します。

**リクエストボディ**

```ts
interface ChapterGroupRequest {
  id?: string // Omit to create a new chapter group.
  mangaId: string
  title: string
}
```

### `DELETE /edit/chapter-group/:id`

チャプターグループと、それに含まれるすべてのチャプターおよび画像を削除します。

**パスパラメーター**

| パラメーター | 型       | 説明                           |
| :----------- | :------- | :----------------------------- |
| `id`         | `string` | チャプターグループの ID です。 |

### `GET /edit/chapter-group/:id/chapters`

チャプターグループに属するチャプターを、表示順に並んだ一覧として取得します。

**パスパラメーター**

| パラメーター | 型       | 説明                           |
| :----------- | :------- | :----------------------------- |
| `id`         | `string` | チャプターグループの ID です。 |

**レスポンス — `200 OK`**

```ts
type ChaptersResponse = Chapter[]

interface Chapter {
  id: string
  title?: string
  locked?: boolean
}
```

## チャプターの管理

### `POST /edit/chapter`

チャプターを追加または更新します。新しいチャプターを作成する場合は `id` を省略してください。指定した場合は、その ID の既存のチャプターを更新します。

**リクエストボディ**

```ts
interface ChapterUpsertRequest {
  id?: string // Omit to create a new chapter.
  title: string
  chapterGroupId: string
}
```

### `DELETE /edit/chapter/:id`

チャプターと、それに関連するすべての画像を削除します。

**パスパラメーター**

| パラメーター | 型       | 説明                   |
| :----------- | :------- | :--------------------- |
| `id`         | `string` | チャプターの ID です。 |

### `POST /edit/chapter/order`

チャプターグループ内のチャプターの順序を設定します。リクエストボディは、順番に並べたチャプター ID の一覧です。最初の ID が最初のチャプター、2 番目の ID が 2 番目のチャプターとなり、以降も同様に並びます。

**リクエストボディ**

```ts
type ChapterOrderRequest = string[] // Ordered list of chapter IDs
```

### `POST /edit/chapter/:id/images`

チャプターの末尾に画像を追加します。`images` 配列の各要素は、Base64 でエンコードした画像にしてください。

**パスパラメーター**

| パラメーター | 型       | 説明                   |
| :----------- | :------- | :--------------------- |
| `id`         | `string` | チャプターの ID です。 |

**リクエストボディ**

```ts
interface ChapterImagesRequest {
  images: string[] // Array of image data, each encoded in base64.
}
```

### `POST /edit/images/delete`

完全な URL を指定して、1 枚以上の画像を削除します。チャプターからページを取り除く場合や、どこからも参照されなくなった画像を整理する場合に使用します。

**リクエストボディ**

```ts
type DeleteImagesRequest = string[] // List of image URLs to delete.
```

### `POST /edit/images/order`

チャプター内の画像の順序を設定します。リクエストボディは、順番に並べた画像 URL の一覧です。最初の URL が最初の画像、2 番目の URL が 2 番目の画像となり、以降も同様に並びます。

**リクエストボディ**

```ts
type ImageOrderRequest = string[] // Ordered list of image URLs.
```
