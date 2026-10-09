---
title: JavaScript プラグイン
description: JavaScript ソースの JSON マニフェスト、コールバックの仕様、実行環境の補助関数、設定、リクエスト間隔の完全なリファレンスです。
sidebar:
  order: 2
---

この仕様は、オンラインのソースから [Mankai](https://github.com/mankai-app/mankai) に漫画を提供するプラグインの JSON 形式と JavaScript API を説明します。

JavaScript プラグインは読み取り専用のソースです。アプリは URL または貼り付けられた JSON からマニフェストを読み込み、非表示の WebKit Web ビューでコールバックスクリプトを実行します。

:::caution[信頼できるプラグイン]

プラグインはネットワークリクエストを送信し、アプリのプラグイン実行環境で任意の JavaScript を実行できるため、信頼できるものだけをインストールしてください。

:::

## マニフェスト

マニフェストは JSON オブジェクトです。デコーダーが必須とするフィールドは `id` だけですが、利用する操作に必要なコールバックスクリプトも用意する必要があります。

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

### メタデータのフィールド

| フィールド        | 型                       | 説明                                                                                                                            |
| :---------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `id`              | `string`                 | 変更されない、全体で一意なプラグイン識別子です。永続ストレージの保存範囲の識別にも使います。                                    |
| `name`            | `string`                 | 表示名です。省略すると ID を使います。                                                                                          |
| `version`         | `string`                 | アプリに表示され、更新の比較に使われるプラグインのバージョンです。                                                              |
| `description`     | `string`                 | ソース設定に表示する短い説明です。                                                                                              |
| `authors`         | `string[]`               | プラグインの作者です。既定値は `[]` です。                                                                                      |
| `repository`      | `string`                 | ソースコードまたはプロジェクトの URL です。                                                                                     |
| `updatesUrl`      | `string`                 | 更新確認に使うマニフェストの URL です。                                                                                         |
| `availableGenres` | `Genre[]`                | ソースが対応するジャンルです。既定値は `[]` です。                                                                              |
| `scripts`         | `Record<string, string>` | 下記のスクリプト名をキーとする JavaScript ソースです。未知のキーは無視されます。                                                |
| `configs`         | `Config[]`               | ユーザーが変更でき、スクリプトから参照できる設定です。既定値は `[]` です。                                                      |
| `getImageHeaders` | `Record<string, string>` | 指定すると、Mankai はすべての画像 URL をこのヘッダー付きのネイティブリクエストで取得し、`getImage` スクリプトを呼び出しません。 |
| `cooldown`        | `Cooldown`               | 任意のリクエスト間隔と画像の同時取得数の制限です。                                                                              |
| `capabilities`    | `PluginCapability[]`     | プラグインが対応する操作です。既定では `mangaUpdates` 以外のすべての機能が有効です。                                            |

### スクリプトの形式

各スクリプトの値は、関数とエクスポートマーカーを含む文字列です。

<!-- prettier-ignore -->
```js
async function isOnline() {
  const response = await fetch('https://example.com/')
  return response.ok
}

export{isOnline as default};
```

マーカーは `export{functionName as default};` の形式にする必要があります。Mankai は実行前にマーカーを取り除き、指定された名前の関数を呼び出します。関数は同期でも非同期でも構いません。Mankai は結果を待機します。スクリプトには、エクスポートする関数に加えて補助関数を含めることもできます。

:::caution[未実装のコールバック]

マニフェストはスクリプトが不足していても読み込まれますが、存在しないコールバックを呼び出すと実行時に失敗します。プラグインが宣言する各機能に対応するコールバックを用意してください。`getImage` の代わりに `getImageHeaders` を使うこともできます。

:::

## コールバックスクリプト

任意の `capabilities` フィールドには、以下の値を指定できます。

:::note[既定の機能]

省略すると `mangaUpdates` 以外のすべての機能が有効になります。実装済みの操作だけをこのフィールドに指定すると、アプリが未対応のコールバックを呼び出すことを避けられます。

:::

```text
onlineCheck, suggestions, list, listByGenre, listByStatus, search, searchByGenre, searchByStatus, searchByAuthor, mangaDetails, batchMangas, mangaUpdates, chapter, image
```

:::note[更新確認]

`batchMangas` または `mangaUpdates` を持つプラグインは、ライブラリの更新確認に対応できます。専用の `getMangaUpdates` コールバックで、どの漫画を更新ありとするかをプラグイン側で制御する場合は、`mangaUpdates` を含めます。Mankai の標準動作を使う場合は、`mangaUpdates` を含めません。標準動作では `getMangas` を呼び出し、返されたメタデータでローカルの情報を更新し、最新チャプターを保存済みの情報と比較します。この動作には `batchMangas` が必要です。

:::

キーと関数シグネチャは次のとおりです。

| キー               | 関数シグネチャ                                 | 戻り値                                                        |
| :----------------- | :--------------------------------------------- | :------------------------------------------------------------ |
| `isOnline`         | `isOnline()`                                   | `boolean`                                                     |
| `getSuggestion`    | `getSuggestion(query)`                         | `string[]`                                                    |
| `search`           | `search(query, page, genre, status, isAuthor)` | `Manga[]`                                                     |
| `getList`          | `getList(page, genre, status)`                 | `Manga[]`                                                     |
| `getMangas`        | `getMangas(ids)`                               | `Manga[]`                                                     |
| `getMangaUpdates`  | `getMangaUpdates(mangas)`                      | メタデータの差分と更新フラグを持つ `MangaUpdate[]`            |
| `getDetailedManga` | `getDetailedManga(id)`                         | `DetailedManga`                                               |
| `getChapter`       | `getChapter(manga, chapter)`                   | 画像 URL の `string[]`                                        |
| `getImage`         | `getImage(url)`                                | Base64 画像データ、または画像プロキシリクエストのオブジェクト |

各引数と戻り値の詳細を以下に説明します。

### `isOnline`

ソースに接続でき、利用可能な場合は `true`、それ以外は `false` を返します。例外を投げた場合や、真偽値以外を返した場合は、プラグイン呼び出しの失敗として扱われます。

### `getSuggestion(query)`

検索候補として使える文字列の配列を返します。マニフェストのキーは単数形の `getSuggestion` です。

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

タイトルまたは作者で漫画を検索します。`page` は 1 から始まるページ番号です。`genre` は[ジャンル](#ジャンル)にある文字列のいずれかで、`status` は[状態](#状態)にある数値のいずれかです。`isAuthor` が `true` の場合は、タイトル欄ではなく作者欄を検索します。簡易情報を持つ `Manga` オブジェクトの配列を返します。

### `getList(page, genre, status)`

ソースからページ単位の一覧を返します。`page`、`genre`、`status` の引数は `search` と同じです。

### `getMangas(ids)`

指定された文字列 ID に対応する、漫画の簡易オブジェクトの配列を返します。一部の ID がソースに存在しなくなっている場合は、要求数より少ない項目を返しても構いません。

### `getMangaUpdates(mangas)`

各リクエスト項目には、漫画の ID と、Mankai が現在把握している最新チャプターが含まれます。このコールバックで、プラグイン側から更新動作を制御できます。Mankai の標準の一括比較を使う場合は、`mangaUpdates` 機能を指定しないでください。

```ts
interface MangaUpdateRequest {
  id: string
  latestChapter: Chapter
}
```

`MangaUpdate[]` を返します。各結果には `id` と `updates` が必要です。保存済みの漫画を更新ありとするかどうかは、`updates` フラグだけで決まります。メタデータは、`updates` が `false` の結果も含め、返されたすべての結果で更新されます。

:::note[部分的な更新]

それ以外のプロパティは部分的な更新として扱われます。Mankai は既存のローカル漫画データに対し、`null` 以外のプロパティだけを適用します。省略されたプロパティと `null` のプロパティは、既存の値を変更しません。`latestChapter` が次回の更新確認の比較基準として保存されるのは、`updates` が `true` の場合のみです。レスポンスに含まれない漫画のデータは変更されません。

:::

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

たとえば `{ id: "completed-series", updates: false, status: 2 }` を返すと、未読の更新として表示せずに状態を更新できます。

### `getDetailedManga(id)`

完全な `DetailedManga` オブジェクトを返します。Mankai は戻り値を JSON にシリアライズしてからデコードするため、JSON 文字列ではなく JavaScript オブジェクトを返してください。

### `getChapter(manga, chapter)`

`chapter` の画像 URL を表示順に返します。`manga` は `getDetailedManga` が返した完全なオブジェクトで、`chapter` は選択されたチャプターのオブジェクトです。Mankai は後から各画像 URL を `getImage` に渡すため、画像 URL は絶対 URL にしてください。

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

`getImageHeaders` がない場合、Mankai は表紙とチャプターのページに対してこのスクリプトを呼び出します。次のいずれかを返せます。

1. 画像のバイト列を Base64 でエンコードした文字列です。`data:image/...;base64,` の接頭辞は含めないでください。
2. Mankai にネイティブリクエストを指示するオブジェクトです。

   ```ts
   interface ImageProxyRequest {
     url: string
     headers: Record<string, string>
   }
   ```

例を示します。

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

マニフェストに `getImageHeaders` がある場合は、すべての画像 URL に対して同等のネイティブリクエストが自動的に行われます。

```json
{
  "getImageHeaders": {
    "Referer": "https://example.com/",
    "User-Agent": "Mozilla/5.0"
  }
}
```

:::note[画像リクエストの優先順位]

この方式は `getImage` スクリプトより優先されます。ヘッダーは表紙とチャプターのページの両方に適用されます。

:::

## データ型

コールバックの戻り値は、以下の形式に対応しています。任意のプロパティは省略できます。

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

:::note[省略されたフィールド]

詳細な漫画情報で `authors`、`genres`、`chapters` を省略すると、空の配列になります。

:::

### ジャンル

Mankai が認識する文字列は次のとおりです。

```text
all, action, romance, yuri, boysLove, otokonoko, schoolLife, adventure,
harem, speculativeFiction, war, suspense, fanFiction, comedy, magic, horror,
historical, sports, mature, mecha
```

### 状態

| 名前        | 値  |
| :---------- | :-- |
| `any`       | `0` |
| `onGoing`   | `1` |
| `completed` | `2` |

### 閲覧方向

| 名前          | 値  |
| :------------ | :-- |
| `leftToRight` | `1` |
| `rightToLeft` | `2` |
| `vertical`    | `3` |

## 実行環境の補助関数

Mankai はすべてのコールバックスクリプトに、以下の補助関数を注入します。

### `fetch(url, options)`

実行環境は、ネイティブのネットワーク処理を使う `fetch` を提供します。対応するリクエストオプションは次のとおりです。

```ts
interface FetchOptions {
  method?: string // Defaults to "GET"
  headers?: Record<string, string> | Headers
  body?: string
}
```

返されるレスポンスには、以下のプロパティとメソッドがあります。

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

:::note[fetch のエラー処理]

`2xx` 以外のレスポンスでも Promise は成功し、`ok` が `false` になります。`ok` または `status` を使って処理してください。ネットワークエラーや無効な URL による失敗では、Promise が拒否されます。リクエストとレスポンスのボディはネイティブブリッジを通して転送されるため、バイナリのレスポンスには `arrayBuffer()` を使ってください。

:::

### `console.log(...values)`

`console.log` の出力先は Mankai の JavaScript プラグインログに変更されています。開発中のプラグインの問題を調べる際に使えます。

```js
console.log('searching', query)
```

### `s2t(text)` と `t2s(text)`

これらの非同期補助関数は、OpenCC を使って中国語の文字を変換します。

```js
const traditional = await s2t('简体转繁体')
const simplified = await t2s('繁體轉簡體')
```

`s2t` は簡体字から繁体字に変換し、`t2s` はその逆に変換します。

### `getConfigs()`

マニフェストで宣言された設定の現在値を、配列で返します。

```ts
interface ConfigValue {
  key: string
  value: unknown
}
```

例を示します。

```js
function configValue(key) {
  return getConfigs().find((config) => config.key === key)?.value
}

const username = configValue('username')
```

### 永続ストレージ

以下の補助関数は、プラグインの `id` ごとに分離されたキーバリューストアに文字列を保存します。

```ts
getValue(key: string): Promise<string | null>;
setValue(key: string, value: string): Promise<void>;
removeValue(key: string): Promise<boolean>;
```

3 つの補助関数すべてに `await` を使ってください。値はアプリの再起動やプラグインの更新後も保持され、プラグインを削除すると取り除かれます。

```js
const token = await getValue('token')
if (!token) {
  await setValue('token', 'new-token')
}
await removeValue('temporary-value')
```

## 設定

設定項目は次の形式です。

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

:::note[色の不透明度]

`color` 型の設定には、sRGB の 16 進数文字列を使用します。既定では不透明な色を選択し、`"#F2E4C9"` のような大文字の `#RRGGBB` 形式で保存します。`supportsOpacity` を `true` にすると不透明度を調整できるようになり、`#RRGGBBAA` 形式で保存します。入力時の先頭の `#` は省略できます。

:::

`options` は `select` の設定で使います。`min`、`max`、`step` は `slider` の範囲と刻み幅を設定します。アプリは各設定を `defaultValue` で初期化し、ソース設定で行った変更を保存して、現在値を `getConfigs()` から公開します。

例を示します。

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

:::note[URL による設定の上書き]

URL からプラグインをインポートする場合、設定のキーと一致するクエリパラメーターが、宣言された既定値を上書きします。値は `type` に応じて解析されます。真偽値は `true` と `1` を認識し、数値とスライダーは整数または小数として解析します。`text`、`password`、`select`、`color` の値は、前後の空白を取り除いた文字列のまま扱います。

:::

## リクエスト間隔と同時実行数

間隔の値はミリ秒単位です。

```ts
interface Cooldown {
  default?: number
  getImage?: number
  getImageConcurrency?: number
}
```

| フィールド            | 説明                                                                             |
| :-------------------- | :------------------------------------------------------------------------------- |
| `default`             | 検索、一覧、詳細、チャプターの取得など、画像以外の操作の最小間隔です。           |
| `getImage`            | 画像リクエストの最小間隔です。画像はほかの操作とは別にスケジュールされます。     |
| `getImageConcurrency` | 同時に処理できる画像リクエストの最大数です。`1` 未満の値では制限を設定しません。 |

これらのフィールドを使い、ソースのレート制限を守ってください。例を示します。

```json
{
  "cooldown": {
    "default": 500,
    "getImage": 100,
    "getImageConcurrency": 2
  }
}
```
