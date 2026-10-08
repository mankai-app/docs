---
title: JavaScript 插件
description: Mankai JavaScript 插件的清单、回调、数据类型与运行时 API 完整参考。
---

本规范说明为 [Mankai](https://github.com/mankai-app/mankai) 提供在线漫画内容的插件所使用的 JSON 格式和 JavaScript API。

JavaScript 插件是只读内容源。应用从网址或粘贴的 JSON 加载清单，然后在隐藏的 WebKit 网页视图中执行回调脚本。请仅安装可信的插件，因为插件可以在应用的插件运行环境中发起网络请求并执行任意 JavaScript 代码。

<span id="manifest"></span>

## 清单

清单是一个 JSON 对象。解码器只要求提供 `id` 字段，但仍需提供实际使用的操作所要求的回调脚本。

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

### 元数据字段

| 字段              | 类型                     | 说明                                                                              |
| :---------------- | :----------------------- | :-------------------------------------------------------------------------------- |
| `id`              | `string`                 | 稳定且全局唯一的插件标识符，也用于划分持久存储的作用域。                          |
| `name`            | `string`                 | 显示名称，省略时使用 ID。                                                         |
| `version`         | `string`                 | 在应用中显示并用于检查更新的插件版本。                                            |
| `description`     | `string`                 | 在来源设置中显示的简短描述。                                                      |
| `authors`         | `string[]`               | 插件作者，默认值为 `[]`。                                                         |
| `repository`      | `string`                 | 源代码或项目的网址。                                                              |
| `updatesUrl`      | `string`                 | 用于检查更新的清单网址。                                                          |
| `availableGenres` | `Genre[]`                | 内容源支持的漫画类型，默认值为 `[]`。                                             |
| `scripts`         | `Record<string, string>` | 以以下脚本名称为键的 JavaScript 源代码，未知的键会被忽略。                        |
| `configs`         | `Config[]`               | 向脚本提供的用户可配置值，默认值为 `[]`。                                         |
| `getImageHeaders` | `Record<string, string>` | 如果存在，Mankai 使用这些原生请求标头下载所有图片网址，而不调用 `getImage` 脚本。 |
| `cooldown`        | `Cooldown`               | 可选的请求节流和图片并发限制。                                                    |
| `capabilities`    | `PluginCapability[]`     | 插件支持的操作，默认启用除 `mangaUpdates` 以外的所有能力。                        |

<span id="script-format"></span>

### 脚本格式

每个脚本值都是包含函数和导出标记的字符串。

<!-- prettier-ignore -->
```js
async function isOnline() {
  const response = await fetch('https://example.com/')
  return response.ok
}

export{isOnline as default};
```

标记必须使用 `export{functionName as default};` 的形式。Mankai 在执行前移除该标记并调用指定函数。函数可以是同步或异步函数，Mankai 会等待返回结果。除了导出的函数，脚本还可以包含辅助函数。

清单解析器不会拒绝缺少脚本的清单，但调用缺失的回调会在运行时失败。插件应提供所声明能力对应的回调，也可以使用 `getImageHeaders` 替代 `getImage`。

<span id="callback-scripts"></span>

## 回调脚本

可选字段 `capabilities` 接受下列值。省略时，除 `mangaUpdates` 以外的所有能力都会启用。插件可以使用此字段声明自己实现的操作，让应用避免调用不支持的回调。

```text
onlineCheck, suggestions, list, listByGenre, listByStatus, search, searchByGenre, searchByStatus, searchByAuthor, mangaDetails, batchMangas, mangaUpdates, chapter, image
```

支持 `batchMangas` 或 `mangaUpdates` 的插件可以参与书库更新检查。如果需要插件通过专用的 `getMangaUpdates` 回调决定哪些漫画应标记为有更新，请包含 `mangaUpdates`。省略 `mangaUpdates` 时，Mankai 使用默认行为，调用 `getMangas`、刷新返回的元数据并比较返回的最新章节。默认行为要求支持 `batchMangas`。

键与函数签名如下。

| 键                 | 函数签名                                       | 返回值                               |
| :----------------- | :--------------------------------------------- | :----------------------------------- |
| `isOnline`         | `isOnline()`                                   | `boolean`                            |
| `getSuggestion`    | `getSuggestion(query)`                         | `string[]`                           |
| `search`           | `search(query, page, genre, status, isAuthor)` | `Manga[]`                            |
| `getList`          | `getList(page, genre, status)`                 | `Manga[]`                            |
| `getMangas`        | `getMangas(ids)`                               | `Manga[]`                            |
| `getMangaUpdates`  | `getMangaUpdates(mangas)`                      | `MangaUpdate[]` 元数据补丁与更新标记 |
| `getDetailedManga` | `getDetailedManga(id)`                         | `DetailedManga`                      |
| `getChapter`       | `getChapter(manga, chapter)`                   | 图片网址数组 `string[]`              |
| `getImage`         | `getImage(url)`                                | Base64 图片数据或图片代理请求对象    |

以下说明各参数与返回结果。

### `isOnline`

当内容源可访问且可用时返回 `true`，否则返回 `false`。抛出异常或返回非布尔值会被视为插件调用失败。

### `getSuggestion(query)`

返回适合用作搜索建议的字符串数组。清单中的键使用单数形式 `getSuggestion`。

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

按标题或作者搜索漫画。`page` 是从 1 开始的页码。`genre` 是[漫画类型](#genres)中的一个字符串，`status` 是[状态](#statuses)中的一个数值。当 `isAuthor` 为 `true` 时，搜索内容源的作者字段而不是标题字段。返回轻量的 `Manga` 对象数组。

### `getList(page, genre, status)`

返回内容源的分页列表，使用与 `search` 相同的 `page`、`genre` 和 `status` 参数。

### `getMangas(ids)`

根据请求的字符串 ID 返回轻量漫画对象。如果内容源已不再包含某些 ID，返回的条目数可以少于请求数。

### `getMangaUpdates(mangas)`

每个请求条目包含漫画 ID 和 Mankai 当前已知的最新章节。此回调让插件控制更新行为。如果希望使用 Mankai 默认的批量比较方式，请省略 `mangaUpdates` 能力。

```ts
interface MangaUpdateRequest {
  id: string
  latestChapter: Chapter
}
```

返回 `MangaUpdate[]`。每个结果必须包含 `id` 和 `updates`。Mankai 仅根据 `updates` 的值决定是否将已保存的漫画标记为有更新。Mankai 会根据所有返回结果刷新元数据，包括 `updates` 为 `false` 的结果。

其余属性用于局部更新。Mankai 只将非 `null` 属性应用到现有的本地漫画快照。省略或设为 `null` 的属性会保留现有值。只有 `updates` 为 `true` 时，Mankai 才会将 `latestChapter` 保存为下次检查更新的比较基准。响应中未包含的漫画保持不变。

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

例如，插件可以返回 `{ id: "completed-series", updates: false, status: 2 }`，只刷新状态而不显示未读更新。

### `getDetailedManga(id)`

返回完整的 `DetailedManga` 对象。Mankai 会先将返回值序列化为 JSON 再解码，因此应返回 JavaScript 对象，而不是 JSON 字符串。

### `getChapter(manga, chapter)`

按顺序返回 `chapter` 的图片网址。`manga` 参数是 `getDetailedManga` 返回的完整对象，`chapter` 是所选章节对象。图片网址应为绝对网址，因为 Mankai 随后会逐一将其传入 `getImage`。

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

未提供 `getImageHeaders` 时，Mankai 对封面和章节页面调用此脚本。接受以下两种结果。

1. 包含原始图片字节的 Base64 字符串，不要包含 `data:image/...;base64,` 前缀。
2. 指示 Mankai 发起原生请求的对象。

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

如果清单包含 `getImageHeaders`，系统会自动对每个图片网址发起等效的原生请求。

```json
{
  "getImageHeaders": {
    "Referer": "https://example.com/",
    "User-Agent": "Mozilla/5.0"
  }
}
```

此模式优先于 `getImage` 脚本，请求标头同时适用于封面和章节页面。

<span id="data-types"></span>

## 数据类型

回调结果接受以下结构，可选属性可以省略。

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

漫画详情中省略的 `authors`、`genres` 和 `chapters` 默认为空数组。

<span id="genres"></span>

### 漫画类型

Mankai 识别以下字符串值。

```text
all, action, romance, yuri, boysLove, otokonoko, schoolLife, adventure,
harem, speculativeFiction, war, suspense, fanFiction, comedy, magic, horror,
historical, sports, mature, mecha
```

<span id="statuses"></span>

### 状态

| 名称        | 值  |
| :---------- | :-- |
| `any`       | `0` |
| `onGoing`   | `1` |
| `completed` | `2` |

<span id="reading-directions"></span>

### 阅读方向

| 名称          | 值  |
| :------------ | :-- |
| `leftToRight` | `1` |
| `rightToLeft` | `2` |
| `vertical`    | `3` |

<span id="runtime-helpers"></span>

## 运行时辅助函数

Mankai 在每个回调脚本中注入以下辅助函数。

### `fetch(url, options)`

运行环境提供使用原生网络的 `fetch` 实现，支持以下请求选项。

```ts
interface FetchOptions {
  method?: string // Defaults to "GET"
  headers?: Record<string, string> | Headers
  body?: string
}
```

返回的响应具有以下属性和方法。

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

非 2xx 响应会正常完成，此时 `ok === false`，请使用 `ok` 或 `status` 处理。网络错误和无效网址会使 Promise 进入拒绝状态。请求体与响应体通过原生桥接传输，因此当响应是二进制内容时请使用 `arrayBuffer()`。

### `console.log(...values)`

`console.log` 会重定向至 Mankai 的 JavaScript 插件日志，可用于开发期间诊断插件。

```js
console.log('searching', query)
```

<span id="s2ttext-and-t2stext"></span>

### `s2t(text)` 与 `t2s(text)`

这些异步辅助函数使用 OpenCC 转换中文文本。

```js
const traditional = await s2t('简体转繁体')
const simplified = await t2s('繁體轉簡體')
```

`s2t` 将简体中文转换为繁体中文，`t2s` 执行反向转换。

### `getConfigs()`

以数组形式返回清单所声明的配置项的当前值。

```ts
interface ConfigValue {
  key: string
  value: unknown
}
```

示例：

```js
function configValue(key) {
  return getConfigs().find((config) => config.key === key)?.value
}

const username = configValue('username')
```

<span id="persistent-storage"></span>

### 持久存储

这些辅助函数在以插件 `id` 为作用域的键值存储中保存字符串值。

```ts
getValue(key: string): Promise<string | null>;
setValue(key: string, value: string): Promise<void>;
removeValue(key: string): Promise<boolean>;
```

三个辅助函数都应使用 `await`。应用重启和插件更新后，值仍然保留。删除插件时，这些值也会删除。

```js
const token = await getValue('token')
if (!token) {
  await setValue('token', 'new-token')
}
await removeValue('temporary-value')
```

<span id="configuration"></span>

## 配置

配置项采用以下结构。

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

`color` 配置使用 sRGB 十六进制字符串。默认情况下，颜色选择器不支持透明度，并保存大写的 `#RRGGBB` 值，例如 `"#F2E4C9"`。将 `supportsOpacity` 设为 `true` 可启用不透明度控制并保存 `#RRGGBBAA` 值。输入时可以省略开头的 `#`。

`options` 用于 `select` 配置。`min`、`max` 和 `step` 指定 `slider` 配置的范围和步长。应用使用 `defaultValue` 初始化每个配置项，持久保存用户在来源设置中的修改，并通过 `getConfigs()` 提供当前值。

示例：

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

从网址导入插件时，匹配的查询参数会覆盖声明的默认值。值按照 `type` 解析。布尔值识别 `true` 和 `1`，数字和滑块值解析为整数或小数，文本、密码、选择和颜色值在去除两端空白后保留为字符串。

<span id="cooldowns"></span>

## 冷却时间

冷却时间以毫秒为单位。

```ts
interface Cooldown {
  default?: number
  getImage?: number
  getImageConcurrency?: number
}
```

| 字段                  | 说明                                                      |
| :-------------------- | :-------------------------------------------------------- |
| `default`             | 搜索、列表、详情和章节请求等非图片操作之间的最小间隔。    |
| `getImage`            | 图片请求之间的最小间隔，图片与其他操作使用独立的调度。    |
| `getImageConcurrency` | 同时进行的图片请求数量上限，小于 `1` 的值表示不设置限制。 |

使用这些字段遵守内容源的请求频率限制，例如：

```json
{
  "cooldown": {
    "default": 500,
    "getImage": 100,
    "getImageConcurrency": 2
  }
}
```
