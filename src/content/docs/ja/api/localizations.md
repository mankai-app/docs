---
title: ローカライズ
description: ソースと漫画のメタデータを翻訳し、複数の言語でチャプターグループを提供します。
sidebar:
  order: 8
---

JavaScript プラグイン、Mankai 互換サーバー、MMA アーカイブでは、`localizations` を使ってメタデータを翻訳できます。チャプターグループの `language` はページの言語を示します。

<span id="language-matching"></span>

## 言語の照合

Mankai は言語タグの完全一致を試し、見つからなければ末尾のサブタグを順に除きます。たとえば `zh-Hant-TW` → `zh-Hant` → `zh` の順です。キーは大文字と小文字を区別し、ハイフンを使います。`zh-TW` は `zh-Hant` には一致しません。最初に一致したエントリーで省略されたフィールドや `null` のフィールドには、別の言語エントリーではなく基本のメタデータを使います。一致するエントリーがなければ、すべて基本の値を使います。

<span id="source-localizations"></span>

## ソースメタデータのローカライズ

プラグインのマニフェスト、または `GET /` のサーバー情報レスポンスに `localizations` を追加します。各言語のエントリーでは `PluginLocalization` のフィールドを上書きできます。ソースのメタデータは、本ごとの言語選択とは独立してアプリの言語に従います。

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

## 漫画とチャプターのローカライズ

漫画、詳細な漫画情報、チャプター、チャプターグループには、任意の `localizations` マップを指定できます。[言語の照合規則](#language-matching)に従います。漫画の ID は言語によって変えません。`MangaLocalization` は簡易メタデータを上書きし、`DetailedMangaLocalization` は下記の詳細フィールドも上書きできます。チャプターとグループで上書きできるのは `title` だけです。

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

本の既定の選択は**自動**で、アプリの言語を使います。本の詳細画面の言語メニューで、特定の言語や**デフォルトの言語**を選べます。後者はローカライズを適用せず基本のフィールドを使います。配列を指定すると、空の配列も含め基本の配列を置き換えます。ローカライズされた `latestChapter` は、自身の `id` を持つチャプターオブジェクトである必要があります。

たとえば、その言語のカスタムジャンルのラベルを空にするには、`customGenres` に `[]` を指定します。

<span id="chapter-groups"></span>

## チャプターグループ

すべてのチャプターグループを最上位の `chapters` 配列に入れます。グループの `language` はページのコンテンツ言語を示します。Mankai は完全一致またはサブタグを除いたタグで最初に一致した言語のグループを表示します。一致しなければ `language` のないグループだけを表示し、**デフォルトの言語**でもこれらのグループを選びます。詳細画面の**すべて表示**で全グループを表示できます。

内容と ID を変えずにグループやチャプターのタイトルを翻訳するには、`localizations` を使います。ページ内容が異なる場合は、異なる ID を持つチャプターを用意し、対応する言語のグループに配置します。

<span id="mma-archives"></span>

## MMA アーカイブ

`metadata.json` では、漫画のメタデータに `DetailedMangaLocalization`、チャプターやグループのタイトルに `ChapterLocalization` を使います。アーカイブのローカライズでは `meta` を省略してください。

ローカライズされた `cover` もアーカイブ内の相対パスにし、基本の表紙と同じ検証規則に従います。各ローカライズの `latestChapter` には、アーカイブ内のいずれかのチャプターに一致する `id` が必要です。チャプター ID は全グループ・全言語を通じて一意にし、各チャプターに空でない `images` 配列を用意します。

アーカイブの構成と画像パスの規則については、[MMA 形式](/ja/api/mma-format/)を参照してください。
