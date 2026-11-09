---
title: 本地化
description: 翻譯來源和漫畫中繼資料，並提供不同語言的章節群組。
sidebar:
  order: 8
---

JavaScript 外掛模組、Mankai 相容伺服器和 MMA 封存檔可透過 `localizations` 翻譯中繼資料。使用章節群組的 `language` 標記頁面內容的語言。

<span id="language-matching"></span>

## 語言比對

Mankai 先嘗試完整語言標籤，再逐步移除最後一個子標籤，例如 `zh-Hant-TW` → `zh-Hant` → `zh`。鍵區分大小寫，並使用連字號。`zh-TW` 不會符合 `zh-Hant`。在首個符合的項目中，省略或為 `null` 的欄位使用基礎中繼資料，不會從其他語言項目補齊。沒有符合的項目時使用全部基礎值。

<span id="source-localizations"></span>

## 來源中繼資料本地化

在外掛模組清單或 `GET /` 的伺服器資訊回應中加入 `localizations`。各語言項目可覆寫 `PluginLocalization` 中的欄位。來源中繼資料跟隨應用程式語言，與單本書籍的語言選擇無關。

```ts
interface PluginLocalization {
  name?: string
  description?: string
  authors?: string[]
  repository?: string
  icon?: string
  homePage?: string
}
```

<span id="manga-localizations"></span>

## 漫畫與章節本地化

漫畫、漫畫詳細資訊、章節和章節組都可以提供可選的 `localizations` 對應表，遵循[語言比對規則](#language-matching)。漫畫 ID 在所有語言中保持不變。`MangaLocalization` 覆寫簡要中繼資料，`DetailedMangaLocalization` 還可覆寫下方列出的詳細資訊欄位。章節和章節組只能覆寫 `title`。

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

書籍預設選擇**自動**，使用應用程式語言。書籍詳細資訊的語言選單可以選擇特定語言，或選擇**預設語言**以使用基礎欄位，不套用本地化覆寫。明確提供的陣列會取代基礎陣列，空陣列也會生效。本地化的 `latestChapter` 必須是包含自身 `id` 的章節物件。

例如，將 `customGenres` 設為 `[]` 可清除該語言的自訂類型標籤。

<span id="chapter-groups"></span>

## 章節群組

所有章節群組都放在頂層 `chapters` 陣列中。章節組的 `language` 表示頁面內容的語言。Mankai 顯示首個符合的完整或更廣泛語言標籤所對應的章節組。沒有符合項目時，只顯示未設定 `language` 的章節組，**預設語言**也選擇這些無標籤章節組。書籍詳細資訊中的**顯示全部**可顯示所有組。

使用 `localizations` 翻譯章節組或章節標題，不會改變內容或 ID。頁面內容不同時，應使用不同 ID 的章節，並放入對應語言的章節組。

<span id="mma-archives"></span>

## MMA 封存檔

在 `metadata.json` 中，漫畫中繼資料使用 `DetailedMangaLocalization`，章節和章節群組標題使用 `ChapterLocalization`。封存檔的本地化項目應省略 `meta`。

本地化的 `cover` 必須是封存檔內相對路徑，遵循與基礎封面相同的驗證規則。每個本地化的 `latestChapter` 都需要一個與封存檔內現有章節符合的 `id`。章節 ID 必須在所有組和語言中保持唯一，每章仍須提供非空的 `images` 陣列。

封存檔結構和圖片路徑規則請參閱[MMA 格式](/zh-tw/api/mma-format/)。
