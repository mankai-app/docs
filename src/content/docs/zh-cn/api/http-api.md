---
title: Mankai 兼容 API
description: 实现 Mankai HTTP 插件调用的兼容服务器 API，提供认证、漫画、章节图片、书库更新检查、搜索与搜索建议。
---

要让 [Mankai](https://github.com/mankai-app/mankai) 的 HTTP 插件与你的服务器交互，服务器必须实现下方定义的兼容 API。服务器支持的操作应使用本规范规定的端点路径、请求体和响应格式。

用户在**设置 → 来源**中添加 **Mankai 兼容**来源来连接服务器。应用配置步骤请参阅[添加来源](/zh-cn/guides/sources/#添加来源)。

如果还需要支持应用内编辑器，请同时遵循[编辑器 API 规范](/zh-cn/api/editor-api/)。

<span id="server-information"></span>

## 服务器信息

### `GET /`

获取服务器信息。

**响应 — `200 OK`**

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

`default` 是插件执行非图片操作时两次调用之间的最小间隔，以毫秒为单位。`getImage` 单独设置图片请求之间的最小间隔。`getImageConcurrency` 可限制并发图片请求数量。

省略 `capabilities` 时，除 `mangaUpdates` 以外的所有能力都会启用。只有显式列出 `mangaUpdates` 时才会启用该能力。

支持 `batchMangas` 或 `mangaUpdates` 的插件可以参与书库更新检查。如果需要服务器通过 `POST /manga/updates` 决定哪些漫画应标记为有更新，请包含 `mangaUpdates`。省略 `mangaUpdates` 时，Mankai 使用默认行为，调用 `POST /manga`、刷新返回的元数据并比较返回的最新章节。默认行为要求支持 `batchMangas`。

<span id="authentication-optional"></span>

## 认证（可选）

若要在服务器上启用认证，必须实现以下两个端点。

客户端调用 `/auth/*` 和 `/` 以外的端点时，会在 `Authorization` 请求标头中包含 `accessToken`。

### `POST /auth/login`

使用用户名和密码换取访问令牌与刷新令牌。

**请求体**

```ts
interface LoginRequest {
  username: string
  password: string
}
```

**响应 — `200 OK`**

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

使用有效的刷新令牌换取新的访问令牌。

**请求体**

```ts
interface RefreshRequest {
  refreshToken: string
}
```

**响应 — `200 OK`**

```ts
interface RefreshResponse {
  message: string
  accessToken: string
}
```

<span id="manga"></span>

## 漫画

这些端点返回漫画及其章节的数据。用于列表、搜索和批量查询的轻量漫画条目共享下方定义的 `Manga` 结构，完整详情端点返回信息更丰富的 `MangaResponse` 结构。

### `GET /manga`

获取分页漫画列表，可按类型、状态或两者进行筛选。

**查询参数**

| 参数     | 类型     | 默认值      | 必填 | 说明                                                 |
| :------- | :------- | :---------- | :--- | :--------------------------------------------------- |
| `page`   | `number` | `1`         | 否   | 要获取的页码。                                       |
| `genre`  | `string` | `"all"`     | 否   | 按单个漫画类型筛选结果。                             |
| `status` | `number` | `0`（全部） | 否   | 按状态筛选，`0` = 全部，`1` = 连载中，`2` = 已完结。 |

**响应 — `200 OK`**

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

获取指定漫画列表的轻量详情。适用于刷新用户书库等批量查询场景，避免逐条调用 `GET /manga/:id` 导致速度过慢。

**请求体**

```ts
type MangaRequest = string[] // Array of manga IDs
```

**响应 — `200 OK`**

返回与 [`GET /manga`](#get-manga) 相同的 `MangaListResponse` 结构。

### `POST /manga/updates`

根据 Mankai 当前已知的最新章节批量检查漫画更新。

此端点让服务器控制更新行为。如果希望使用 Mankai 默认的批量比较方式，请省略 `mangaUpdates` 能力。

**请求体**

```ts
interface MangaUpdateRequest {
  id: string
  latestChapter: Chapter
}

type MangaUpdatesRequest = MangaUpdateRequest[]
```

**响应 — `200 OK`**

返回 `MangaUpdate[]`。每个结果必须包含 `id` 和 `updates`。Mankai 仅根据 `updates` 的值决定是否将已保存的漫画标记为有更新。Mankai 会根据所有返回结果刷新元数据，包括 `updates` 为 `false` 的结果。

其余属性用于局部更新。Mankai 只将非 `null` 属性应用到现有的本地漫画快照。省略或设为 `null` 的属性会保留现有值。只有 `updates` 为 `true` 时，Mankai 才会将 `latestChapter` 保存为下次检查更新的比较基准。响应中未包含的漫画保持不变。

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

获取单部漫画的完整详情，包括简介、作者、类型，以及按章节组组织的完整章节列表。`chapters` 中条目的顺序决定章节组的显示顺序。同一漫画中的章节组标题必须唯一。

**路径参数**

| 参数 | 类型     | 说明      |
| :--- | :------- | :-------- |
| `id` | `string` | 漫画 ID。 |

**响应 — `200 OK`**

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

获取指定章节的页面图片。响应是图片网址列表，可以使用绝对网址或相对于服务器基础网址的相对网址。

**路径参数**

| 参数        | 类型     | 说明      |
| :---------- | :------- | :-------- |
| `id`        | `string` | 漫画 ID。 |
| `chapterId` | `string` | 章节 ID。 |

**响应 — `200 OK`**

```ts
// Array of image URLs (absolute, or relative to the server's base URL).
type ChapterResponse = string[]
```

<span id="search"></span>

## 搜索

### `GET /search`

按标题或作者搜索漫画。

**查询参数**

| 参数       | 类型      | 默认值      | 必填 | 说明                                                 |
| :--------- | :-------- | :---------- | :--- | :--------------------------------------------------- |
| `query`    | `string`  | `null`      | 是   | 搜索查询字符串。                                     |
| `page`     | `number`  | `1`         | 否   | 要获取的页码。                                       |
| `genre`    | `string`  | `"all"`     | 否   | 按单个漫画类型筛选结果。                             |
| `status`   | `number`  | `0`（全部） | 否   | 按状态筛选，`0` = 全部，`1` = 连载中，`2` = 已完结。 |
| `isAuthor` | `boolean` | `false`     | 否   | 搜索作者字段而不是标题字段。                         |

**响应 — `200 OK`**

返回与 [`GET /manga`](#get-manga) 相同的 `MangaListResponse` 结构。

<span id="suggestion"></span>

## 搜索建议

### `GET /suggestion`

获取搜索查询的自动补全建议，通常用于搜索栏中的输入提示。

**查询参数**

| 参数    | 类型     | 默认值 | 必填 | 说明                       |
| :------ | :------- | :----- | :--- | :------------------------- |
| `query` | `string` | `null` | 是   | 需要获取建议的查询字符串。 |

**响应 — `200 OK`**

```ts
// Array of suggested manga titles.
type SuggestionResponse = string[]
```
