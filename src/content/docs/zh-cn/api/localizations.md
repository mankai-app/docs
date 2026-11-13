---
title: 本地化
description: 翻译来源、图片处理器和漫画的元数据，并提供不同语言的章节组。
sidebar:
  order: 8
---

JavaScript 插件、Mankai 兼容服务器、远程图片处理器和 MMA 归档可通过 `localizations` 翻译元数据。使用章节组的 `language` 标记页面内容的语言。

<span id="language-matching"></span>

## 语言匹配

Mankai 先尝试完整语言标签，再逐步移除最后一个子标签，例如 `zh-Hant-TW` → `zh-Hant` → `zh`。键区分大小写，并使用连字符。`zh-TW` 不会匹配 `zh-Hant`。在首个匹配的条目中，省略或为 `null` 的字段使用基础元数据，不会从其他语言条目补齐。没有匹配条目时使用全部基础值。

<span id="source-localizations"></span>

## 来源元数据本地化

在插件清单或 `GET /` 的服务器信息响应中添加 `localizations`。各语言条目可覆盖 `PluginLocalization` 中的字段。来源元数据跟随应用语言，与单本书籍的语言选择无关。

```ts
interface PluginLocalization {
  name?: string
  description?: string
  authors?: string[]
  repository?: string
  icon?: string
  homePage?: string
  availableCustomGenres?: string[]
  configs?: Record<string, ConfigLocalization>
}
```

对于 JavaScript 插件和只读的 Mankai 兼容来源，本地化的 `availableCustomGenres` 会替换整个基础筛选列表。如需在该语言下隐藏自定义类型筛选选项，请设为 `[]`。Mankai 在获取列表和搜索时会将选中的字符串作为 `customGenre` 传递，因此请支持所有已提供的筛选列表中的字符串。

JavaScript 插件和远程图片处理器可使用 [`configs`](#configuration-localizations) 翻译配置标签。Mankai 兼容来源使用应用内置的登录字段。

<span id="remote-image-processor-localizations"></span>

## 远程图片处理器本地化

在远程图片处理器的 `GET /` 响应中添加 `localizations`。Mankai 根据应用语言选择元数据条目。

```ts
interface RemoteLocalization {
  name?: string
  description?: string
  authors?: string[]
  repository?: string
  configs?: Record<string, ConfigLocalization>
}
```

<span id="configuration-localizations"></span>

## 配置本地化

在各语言条目中，`configs` 按基础配置项的 `key` 提供翻译后的 `name`、`description` 和 `select` 选项标签。`options` 以原始选项值为键。省略的标签使用基础配置。Mankai 保存原始键和值，并通过 `getConfigs()` 或 `/process` 请求传递。

```ts
interface ConfigLocalization {
  name?: string
  description?: string
  options?: Record<string, string>
}
```

<span id="manga-localizations"></span>

## 漫画与章节本地化

漫画、漫画详情、章节和章节组都可以提供可选的 `localizations` 映射，遵循[语言匹配规则](#language-matching)。漫画 ID 在所有语言中保持不变。`MangaLocalization` 覆盖简要元数据，`DetailedMangaLocalization` 还可覆盖下方列出的详情字段。章节和章节组只能覆盖 `title`。

```ts
interface ChapterLocalization {
  title?: string
}

interface MangaLocalization {
  title?: string
  cover?: string
  status?: Status
  latestChapter?: Chapter
  meta?: string
}

interface DetailedMangaLocalization extends MangaLocalization {
  readingDirection?: ReadingDirection
  description?: string
  externalLink?: string
  updatedAt?: number // Unix timestamp in milliseconds
  authors?: string[]
  genres?: Genre[]
  customGenres?: string[]
  remarks?: string
}
```

书籍默认选择**自动**，使用应用语言。书籍详情的语言菜单可以选择特定语言，或选择**默认语言**以使用基础字段，不应用本地化覆盖。显式提供的数组会替换基础数组，空数组也会生效。本地化的 `latestChapter` 必须是包含自身 `id` 的章节对象。

例如，将 `customGenres` 设为 `[]` 可清空该语言的自定义类型标签。

<span id="chapter-groups"></span>

## 章节组

所有章节组都放在顶层 `chapters` 数组中。章节组的 `language` 表示页面内容的语言。Mankai 显示首个匹配的完整或更宽泛语言标签对应的章节组。没有匹配时，只显示未设置 `language` 的章节组，**默认语言**也选择这些无标签章节组。书籍详情中的**显示全部**可显示所有组。

使用 `localizations` 翻译章节组或章节标题，不会改变内容或 ID。页面内容不同时，应使用不同 ID 的章节，并放入对应语言的章节组。

<span id="mma-archives"></span>

## MMA 归档

在 `metadata.json` 中，漫画元数据使用 `DetailedMangaLocalization`，章节和章节组标题使用 `ChapterLocalization`。归档的本地化条目应省略 `meta`。

本地化的 `cover` 必须是归档内相对路径，遵循与基础封面相同的校验规则。每个本地化的 `latestChapter` 都需要一个与归档内现有章节匹配的 `id`。章节 ID 必须在所有组和语言中保持唯一，每章仍须提供非空的 `images` 数组。

归档结构和图片路径规则请参阅[MMA 格式](/zh-cn/api/mma-format/)。
