---
title: Mankai Compatible API
description: Implement the compatible server API used by Mankai's HTTP plugin for authentication, manga, chapter images, library updates, search, and suggestions.
sidebar:
  order: 3
---

To let [Mankai](https://github.com/mankai-app/mankai)'s HTTP plugin interact with your server, implement the compatible API described below. Match the endpoint paths, request bodies, and response formats for the operations your server supports.

For an example implementation, see [mankai-app/server](https://github.com/mankai-app/server).

Users connect to your server by adding a **Mankai Compatible** source in **Settings → Sources**. See [source setup](/guides/sources/#add-a-source) for the app configuration steps.

To support the in-app editor, also implement the [Editor API](/api/editor-api/).

## Server information

### `GET /`

Retrieve information about the server.

**Response — `200 OK`**

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
  icon?: string
  homePage?: string
  availableGenres?: Genre[]
  availableCustomGenres?: string[] // Read-only sources, default: []
  cooldown?: Cooldown
  capabilities?: PluginCapability[]
  localizations?: Record<string, PluginLocalization>
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
  | 'listByCustomGenre'
  | 'listByStatus'
  | 'search'
  | 'searchByGenre'
  | 'searchByCustomGenre'
  | 'searchByStatus'
  | 'searchByAuthor'
  | 'mangaDetails'
  | 'batchMangas'
  | 'mangaUpdates'
  | 'chapter'
  | 'image'
```

`default` is the optional minimum delay between non-image plugin calls, expressed in milliseconds. `getImage` configures a separate minimum delay between image calls. `getImageConcurrency` optionally limits the number of concurrent image requests.

The optional `localizations` map overrides source metadata for the app language. For read-only sources, `customGenre` query values come from the active `availableCustomGenres` list. See [Source metadata localizations](/api/localizations/#source-localizations) for supported fields and fallback rules.

:::note[Capabilities and update checks]

When `capabilities` is omitted, all listed capabilities except `mangaUpdates`, `listByCustomGenre`, and `searchByCustomGenre` are enabled. These three capabilities must be listed explicitly.

Plugins with either `batchMangas` or `mangaUpdates` can participate in library update checks. Include `mangaUpdates` when the server should control which manga are marked as updated through `POST /manga/updates`. Exclude `mangaUpdates` to use Mankai's default behavior, which calls `POST /manga`, refreshes the returned metadata, and compares the returned latest chapters. The default behavior requires `batchMangas`.

:::

## Authentication (optional)

If you want to enable authentication on your server, you must implement the following two endpoints.

:::note[Authorization headers]

When the client calls any endpoint other than `/auth/*` and `/`, it will include the `accessToken` in the `Authorization` header.

:::

### `POST /auth/login`

Exchange a username and password for an access token and refresh token.

**Request body**

```ts
interface LoginRequest {
  username: string
  password: string
}
```

**Response — `200 OK`**

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

Exchange a valid refresh token for a new access token.

**Request body**

```ts
interface RefreshRequest {
  refreshToken: string
}
```

**Response — `200 OK`**

```ts
interface RefreshResponse {
  message: string
  accessToken: string
}
```

## Manga

These endpoints return data about manga and their chapters. Lightweight manga entries (used in lists, search, and batch lookups) use the `Manga` type defined below. The full details endpoint returns the more detailed `MangaResponse` type.

Manga, detailed manga, chapters, and chapter groups can return `localizations`. Groups can also declare their content `language`. See [Manga and chapter localizations](/api/localizations/#manga-localizations) for the types and language selection rules. No language query parameter is added to these endpoints.

### `GET /manga`

Retrieve a paginated list of manga, optionally filtered by genre, status, or both.

**Query parameters**

| Parameter     | Type     | Default   | Required | Description                                                  |
| :------------ | :------- | :-------- | :------- | :----------------------------------------------------------- |
| `page`        | `number` | `1`       | No       | The page number to retrieve.                                 |
| `genre`       | `string` | `"all"`   | No       | Filter results by a single genre.                            |
| `customGenre` | `string` | Omitted   | No       | Exact custom genre name. Requires `listByCustomGenre`.       |
| `status`      | `number` | `0` (Any) | No       | Filter by status: `0` = Any, `1` = OnGoing, `2` = Completed. |

**Response — `200 OK`**

```ts
type MangaListResponse = Manga[]

interface Chapter {
  id: string
  title?: string
  locked?: boolean
  localizations?: Record<string, ChapterLocalization>
}

interface Manga {
  id: string
  title?: string
  cover?: string // URL — absolute, or relative to the server's base URL
  status?: Status
  latestChapter?: Chapter
  meta?: string
  localizations?: Record<string, MangaLocalization>
}

enum Status {
  Any = 0,
  OnGoing = 1,
  Completed = 2,
}
```

### `POST /manga`

Retrieve lightweight details for a specific list of manga. This is useful for batch lookups (for example, refreshing a user's library) where calling `GET /manga/:id` for each entry would be too slow.

**Request body**

```ts
type MangaRequest = string[] // Array of manga IDs
```

**Response — `200 OK`**

Returns the same `MangaListResponse` shape as [`GET /manga`](#get-manga).

### `POST /manga/updates`

Check a batch of manga against the latest chapters currently known by Mankai.

This endpoint lets the server control update behavior. Exclude the `mangaUpdates` capability when the server should use Mankai's default batch comparison instead.

**Request body**

```ts
interface MangaUpdateRequest {
  id: string
  latestChapter: Chapter
}

type MangaUpdatesRequest = MangaUpdateRequest[]
```

**Response — `200 OK`**

Return a `MangaUpdate[]`. Every result must include `id` and `updates`. The `updates` flag alone controls whether Mankai marks the saved manga as updated. Metadata is refreshed for every returned result, including results where `updates` is `false`.

:::note[Partial updates]

All other properties are patches. Mankai applies only non-null properties to its existing local manga snapshot. Omitted and `null` properties leave the existing value unchanged. `latestChapter` advances the saved update-check baseline only when `updates` is `true`. Results omitted from the response are left unchanged.

:::

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

Retrieve full details for a single manga, including its description, authors, genres, and all chapter groups and their chapters. Chapter groups appear in the same order as the entries in `chapters`. Chapter group titles must be unique within a manga.

**Path parameters**

| Parameter | Type     | Description     |
| :-------- | :------- | :-------------- |
| `id`      | `string` | The manga's ID. |

**Response — `200 OK`**

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
  customGenres?: string[] // Read-only sources, default: []
  chapters: ChapterGroup[] // Ordered from first group to last group
  remarks?: string
  editable?: boolean // Whether this manga can be edited, defaults to true
  meta?: string
  localizations?: Record<string, DetailedMangaLocalization>
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
  localizations?: Record<string, ChapterLocalization>
}

interface ChapterGroup {
  id?: string // Required for editable manga, Read-only plugins may omit it
  title: string // Unique within this manga
  chapters: Chapter[] // Increasing order: oldest/lowest chapter first
  language?: string
  localizations?: Record<string, ChapterLocalization>
}
```

### `GET /manga/:id/chapter/:chapterId`

Retrieve the page images for a specific chapter. The response is a list of image URLs that may be absolute or relative to the server's base URL.

**Path parameters**

| Parameter   | Type     | Description       |
| :---------- | :------- | :---------------- |
| `id`        | `string` | The manga's ID.   |
| `chapterId` | `string` | The chapter's ID. |

**Response — `200 OK`**

```ts
// Array of image URLs (absolute, or relative to the server's base URL).
type ChapterResponse = string[]
```

## Search

### `GET /search`

Search for manga by title or author.

**Query parameters**

| Parameter     | Type      | Default   | Required | Description                                                  |
| :------------ | :-------- | :-------- | :------- | :----------------------------------------------------------- |
| `query`       | `string`  | `null`    | Yes      | The search query string.                                     |
| `page`        | `number`  | `1`       | No       | The page number to retrieve.                                 |
| `genre`       | `string`  | `"all"`   | No       | Filter results by a single genre.                            |
| `customGenre` | `string`  | Omitted   | No       | Exact custom genre name. Requires `searchByCustomGenre`.     |
| `status`      | `number`  | `0` (Any) | No       | Filter by status: `0` = Any, `1` = OnGoing, `2` = Completed. |
| `isAuthor`    | `boolean` | `false`   | No       | Search the authors field instead of the title field.         |

**Response — `200 OK`**

Returns the same `MangaListResponse` shape as [`GET /manga`](#get-manga).

## Suggestions

### `GET /suggestion`

Retrieve autocomplete suggestions for a search query as the user types.

**Query parameters**

| Parameter | Type     | Default | Required | Description                              |
| :-------- | :------- | :------ | :------- | :--------------------------------------- |
| `query`   | `string` | `null`  | Yes      | The query string to get suggestions for. |

**Response — `200 OK`**

```ts
// Array of suggested manga titles.
type SuggestionResponse = string[]
```
