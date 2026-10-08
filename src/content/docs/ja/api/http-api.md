---
title: Mankai 互換 API
description: Mankai の HTTP プラグインが認証、漫画、チャプター画像、ライブラリ更新、検索、検索候補に使用する互換サーバー API の仕様です。
sidebar:
  order: 3
---

[Mankai](https://github.com/mankai-app/mankai) の HTTP プラグインがサーバーと通信できるようにするには、以下の互換 API を実装してください。サーバーが対応する操作について、エンドポイントのパス、リクエストボディ、レスポンス形式をこの仕様に合わせます。

ユーザーは**設定 → ソース**から **Mankai 互換**ソースを追加してサーバーに接続します。アプリ側の設定手順は、[ソースの追加](/ja/guides/sources/#ソースを追加する)を参照してください。

> アプリ内エディターにも対応させる場合は、[エディター API](/ja/api/editor-api/)にも従う必要があります。

## サーバー情報

### `GET /`

サーバーの情報を取得します。

**レスポンス — `200 OK`**

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

`default` は、画像以外のプラグイン呼び出し間に設ける最小待機時間です。省略可能で、単位はミリ秒です。`getImage` は画像の呼び出しに対して別の最小待機時間を設定します。`getImageConcurrency` を指定すると、画像リクエストの同時実行数を制限できます。

`capabilities` を省略すると、`mangaUpdates` 以外のすべての機能が有効になります。`mangaUpdates` は明示的に指定した場合のみ有効になります。

`batchMangas` または `mangaUpdates` のいずれかを持つプラグインは、ライブラリの更新確認に対応できます。`POST /manga/updates` を通じて、どの漫画を更新ありとして扱うかサーバー側で制御する場合は、`mangaUpdates` を含めてください。Mankai の標準の動作を使用する場合は、`mangaUpdates` を含めないでください。標準の動作では `POST /manga` を呼び出し、返されたメタデータでローカルの情報を更新し、最新チャプターを保存済みの情報と比較します。この動作には `batchMangas` が必要です。

## 認証（任意）

サーバーで認証を有効にする場合は、次の 2 つのエンドポイントを実装する必要があります。

:::note
クライアントが `/auth/*` と `/` 以外のエンドポイントを呼び出すときは、`Authorization` ヘッダーに `accessToken` を含めます。
:::

### `POST /auth/login`

ユーザー名とパスワードを、アクセストークンとリフレッシュトークンに交換します。

**リクエストボディ**

```ts
interface LoginRequest {
  username: string
  password: string
}
```

**レスポンス — `200 OK`**

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

有効なリフレッシュトークンを、新しいアクセストークンに交換します。

**リクエストボディ**

```ts
interface RefreshRequest {
  refreshToken: string
}
```

**レスポンス — `200 OK`**

```ts
interface RefreshResponse {
  message: string
  accessToken: string
}
```

## 漫画

これらのエンドポイントは、漫画とチャプターのデータを返します。一覧、検索、一括取得で使用する漫画の簡易データには、共通の `Manga` 型を使用します。詳細取得のエンドポイントは、より多くの情報を含む `MangaResponse` 型を返します。

### `GET /manga`

ページ分割された漫画の一覧を取得します。必要に応じて、ジャンルや連載状況で絞り込めます。

**クエリパラメーター**

| パラメーター | 型       | 既定値        | 必須   | 説明                                                                 |
| :----------- | :------- | :------------ | :----- | :------------------------------------------------------------------- |
| `page`       | `number` | `1`           | いいえ | 取得するページの番号です。                                           |
| `genre`      | `string` | `"all"`       | いいえ | 1 つのジャンルで結果を絞り込みます。                                 |
| `status`     | `number` | `0`（すべて） | いいえ | 連載状況で絞り込みます。`0` はすべて、`1` は連載中、`2` は完結です。 |

**レスポンス — `200 OK`**

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

指定した漫画の一覧について、簡易データを取得します。たとえばユーザーのライブラリを更新する際に、各作品について `GET /manga/:id` を呼び出すと時間がかかりすぎる場合など、一括取得に適しています。

**リクエストボディ**

```ts
type MangaRequest = string[] // Array of manga IDs
```

**レスポンス — `200 OK`**

[`GET /manga`](#get-manga) と同じ `MangaListResponse` 型を返します。

### `POST /manga/updates`

複数の漫画について、Mankai が現在把握している最新チャプターと比較して更新を確認します。

このエンドポイントでは、更新の判定をサーバー側で制御できます。Mankai の標準の一括比較を使用する場合は、`mangaUpdates` 機能を含めないでください。

**リクエストボディ**

```ts
interface MangaUpdateRequest {
  id: string
  latestChapter: Chapter
}

type MangaUpdatesRequest = MangaUpdateRequest[]
```

**レスポンス — `200 OK`**

`MangaUpdate[]` を返してください。各結果には必ず `id` と `updates` を含めます。保存済みの漫画を更新ありとするかどうかは、`updates` フラグだけで決まります。`updates` が `false` の結果も含め、返されたすべての結果についてメタデータが更新されます。

それ以外のプロパティは部分的な更新として扱われます。Mankai は既存のローカル漫画データに対し、`null` 以外のプロパティだけを適用します。省略されたプロパティと `null` のプロパティは、既存の値を変更しません。`latestChapter` が次回の更新確認の比較基準として保存されるのは、`updates` が `true` の場合のみです。レスポンスに含まれない漫画のデータは変更されません。

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

説明、作者、ジャンル、およびチャプターグループごとにまとめたすべてのチャプターを含む、1 つの漫画の詳細情報を取得します。`chapters` の要素の順番が、チャプターグループの表示順になります。チャプターグループのタイトルは、同じ漫画の中で一意である必要があります。

**パスパラメーター**

| パラメーター | 型       | 説明             |
| :----------- | :------- | :--------------- |
| `id`         | `string` | 漫画の ID です。 |

**レスポンス — `200 OK`**

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

指定したチャプターのページ画像を取得します。レスポンスは画像 URL の一覧です。URL は絶対 URL、またはサーバーのベース URL を基準とする相対 URL を使用できます。

**パスパラメーター**

| パラメーター | 型       | 説明                   |
| :----------- | :------- | :--------------------- |
| `id`         | `string` | 漫画の ID です。       |
| `chapterId`  | `string` | チャプターの ID です。 |

**レスポンス — `200 OK`**

```ts
// Array of image URLs (absolute, or relative to the server's base URL).
type ChapterResponse = string[]
```

## 検索

### `GET /search`

タイトルまたは作者で漫画を検索します。

**クエリパラメーター**

| パラメーター | 型        | 既定値        | 必須   | 説明                                                                 |
| :----------- | :-------- | :------------ | :----- | :------------------------------------------------------------------- |
| `query`      | `string`  | `null`        | はい   | 検索する文字列です。                                                 |
| `page`       | `number`  | `1`           | いいえ | 取得するページの番号です。                                           |
| `genre`      | `string`  | `"all"`       | いいえ | 1 つのジャンルで結果を絞り込みます。                                 |
| `status`     | `number`  | `0`（すべて） | いいえ | 連載状況で絞り込みます。`0` はすべて、`1` は連載中、`2` は完結です。 |
| `isAuthor`   | `boolean` | `false`       | いいえ | タイトルの代わりに作者のフィールドを検索します。                     |

**レスポンス — `200 OK`**

[`GET /manga`](#get-manga) と同じ `MangaListResponse` 型を返します。

## 検索候補

### `GET /suggestion`

検索文字列の入力補完候補を取得します。通常は、検索バーに入力している途中の候補表示に使用します。

**クエリパラメーター**

| パラメーター | 型       | 既定値 | 必須 | 説明                           |
| :----------- | :------- | :----- | :--- | :----------------------------- |
| `query`      | `string` | `null` | はい | 候補を取得する検索文字列です。 |

**レスポンス — `200 OK`**

```ts
// Array of suggested manga titles.
type SuggestionResponse = string[]
```
