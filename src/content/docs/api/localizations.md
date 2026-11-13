---
title: Localizations
description: Translate source, image processor, and manga metadata and provide chapter groups in different languages.
sidebar:
  order: 8
---

Use `localizations` to translate metadata in JavaScript plugins, Mankai Compatible servers, remote image processors, and MMA archives. Use a chapter group's `language` to identify the language of its pages.

## Language matching

Mankai tries the exact language tag, then removes the last subtag until it finds an entry. For example, it tries `zh-Hant-TW`, then `zh-Hant`, then `zh`. Keys are case-sensitive and use hyphens. `zh-TW` does not match `zh-Hant`. In the first matching entry, omitted or `null` fields use the base metadata. If no entry matches, all base values are used.

<span id="source-localizations"></span>

## Source metadata localizations

Add `localizations` to the plugin manifest or the server information response from `GET /`. Each language entry can override the fields in `PluginLocalization`. Source metadata follows the app language, independently of a book's language selection.

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

In JavaScript plugins and read-only Mankai Compatible sources, a localized `availableCustomGenres` replaces the entire base filter list. Use `[]` to offer no custom genre filters for that language. Mankai sends the selected string as `customGenre` in list and search calls, so accept the strings from every filter list you publish.

JavaScript plugins and remote image processors can translate configuration labels with [`configs`](#configuration-localizations). Mankai Compatible sources use the app’s built-in sign-in fields.

## Remote image processor localizations

Add `localizations` to the remote image processor’s `GET /` response. Mankai uses the app language to select a metadata entry.

```ts
interface RemoteLocalization {
  name?: string
  description?: string
  authors?: string[]
  repository?: string
  configs?: Record<string, ConfigLocalization>
}
```

## Configuration localizations

Within a language entry, `configs` maps each base configuration `key` to its translated `name`, `description`, and `select` option labels. For `options`, use each original option value as the key. Omitted labels use the base configuration. Mankai saves and sends the original keys and values through `getConfigs()` or the `/process` request.

```ts
interface ConfigLocalization {
  name?: string
  description?: string
  options?: Record<string, string>
}
```

<span id="manga-localizations"></span>

## Manga and chapter localizations

Manga, detailed manga, chapters, and chapter groups accept optional `localizations` maps that follow the [language matching rules](#language-matching). A manga ID remains the same across languages. `MangaLocalization` overrides lightweight metadata, while `DetailedMangaLocalization` adds the detailed fields shown below. Chapters and groups can override only `title`.

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

Books default to **Auto**, which uses the app language. The language menu on book details can select a specific language or **Default Language**, which uses base fields without applying a localization. Arrays that are supplied replace the base arrays, including empty arrays. A localized `latestChapter` must be a chapter object with its own `id`.

For example, set `customGenres` to `[]` to clear the custom genre labels for a language.

## Chapter groups

Keep all chapter groups in the top-level `chapters` array. Set a group's `language` to identify the language of its page content. Mankai shows groups for the first matching exact or broader tag. If none match, it shows only groups with no `language`. **Default Language** also selects those untagged groups. **Show All** on book details reveals every group.

Use `localizations` to translate a group or chapter title without changing its content or ID. For different page content, supply separate chapters with distinct IDs and place them in the appropriate language groups.

## MMA archives

In `metadata.json`, use `DetailedMangaLocalization` for manga metadata and `ChapterLocalization` for chapter and group titles. Omit `meta` from archive localizations.

Localized `cover` values must be archive-relative paths and follow the same validation rules as the base cover. Every localized `latestChapter` needs an `id` matching a chapter anywhere in the archive. Chapter IDs must remain unique across all groups and languages. Each chapter still requires its own nonempty `images` array.

See [MMA format](/api/mma-format/) for the archive structure and image path rules.
