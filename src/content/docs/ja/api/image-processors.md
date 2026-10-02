---
title: 画像処理 API
description: メタデータ、設定、マルチパートリクエスト、認証を含む、リモート画像処理サービスの完全な API 仕様です。
sidebar:
  order: 5
---

この仕様は、Mankai のリモート画像処理サービスが使用する HTTP API を定義します。利用者は、**設定 → 画像処理**でサーバーのベース URL を追加します。Mankai は処理サービスのメタデータを読み込み、サーバーが定義した設定項目を表示します。処理サービスを有効にすると、リーダーの各画像をサーバーに送信します。

## エンドポイント

| メソッド | パス            | 認証 | 目的                                       |
| :------- | :-------------- | :--- | :----------------------------------------- |
| `GET`    | `/`             | 不要 | 処理サービスのメタデータと設定を返します。 |
| `POST`   | `/process`      | 任意 | 1 枚の画像を処理します。                   |
| `POST`   | `/auth/login`   | 不要 | 認証が有効な場合にログインします。         |
| `POST`   | `/auth/refresh` | 不要 | アクセストークンを更新します。             |

利用者が入力する URL はベース URL です。たとえば `https://images.example.com/mankai` を入力すると、画像処理のエンドポイントは `https://images.example.com/mankai/process` になります。

## 処理サービスの情報

### `GET /`

メタデータのエンドポイントは、認証なしで利用できる必要があります。

**レスポンス — `200 OK`**

```ts
interface ImageProcessorInfo {
  id: string // Stable server/processor identifier
  name?: string
  version?: string
  description?: string
  authors?: string[] // Default: []
  repository?: string
  authenticationEnabled?: boolean // Default: false
  configs?: Config[] // Default: []
}

type ConfigType =
  'text' | 'password' | 'number' | 'slider' | 'boolean' | 'select' | 'color'

interface Config {
  key: string // Unique within this processor
  name: string // User-facing label or localization key
  description?: string
  type: ConfigType
  defaultValue: string | number | boolean
  options?: string[] // Used by "select"
  min?: number // Used by "slider"
  max?: number // Used by "slider"
  step?: number // Used by "slider"
  supportsOpacity?: boolean // Used by "color", defaults to false
}
```

`color` 型の設定には、sRGB の 16 進数文字列を使用します。既定では不透明な色を選択し、`"#F2E4C9"` のような大文字の `#RRGGBB` 形式で保存します。`supportsOpacity` を `true` にすると不透明度を調整できるようになり、`#RRGGBBAA` 形式で保存します。入力時の先頭の `#` は省略できます。

例を示します。

```json
{
  "id": "com.example.manga-denoise",
  "name": "Manga Denoise",
  "version": "1.0.0",
  "description": "Removes scan noise while preserving line art.",
  "authors": ["Example Lab"],
  "repository": "https://example.com/manga-denoise",
  "authenticationEnabled": false,
  "configs": [
    {
      "key": "strength",
      "name": "Strength",
      "description": "Higher values remove more noise.",
      "type": "slider",
      "defaultValue": 0.5,
      "min": 0,
      "max": 1,
      "step": 0.1
    },
    {
      "key": "preserveText",
      "name": "Preserve text",
      "type": "boolean",
      "defaultValue": true
    }
  ]
}
```

## 画像処理

### `POST /process`

画像をバイナリのまま送信するため、リクエストには `multipart/form-data` を使用します。以下の 3 つのパートだけを含めてください。

| パート    | コンテンツタイプ   | 値                                                  |
| :-------- | :----------------- | :-------------------------------------------------- |
| `image`   | `image/png`        | パイプライン内の現在の画像を表す PNG ファイルです。 |
| `configs` | `application/json` | サーバーが定義したすべての設定の現在値です。        |
| `context` | `application/json` | 論理ポイント単位で表したリーダーの表示サイズです。  |

`configs` は、JavaScript プラグインの設定 API と同じキーと値の形式を使用します。

```ts
interface ConfigValue {
  key: string
  value: string | number | boolean
}

type ConfigValues = ConfigValue[]
```

`configs` パートの例を示します。

```json
[
  { "key": "strength", "value": 0.8 },
  { "key": "preserveText", "value": true }
]
```

`context` パートは次の形式です。

```ts
interface ProcessContext {
  pointSize: {
    width: number
    height: number
  }
}
```

サーバーは、処理済みの画像を直接返す必要があります。ステータスコードは `2xx`、`Content-Type` は `image/*` としてください。PNG、JPEG、WebP、HEIF、およびクライアントのプラットフォームが対応するその他の画像形式を使用できます。処理済みの画像は、次の画像処理サービスに渡されるため、実用的な解像度と画質を維持してください。

`2xx` 以外のレスポンスでは、短いプレーンテキストまたは JSON のエラーボディを返すことができます。Mankai はその処理を失敗として扱い、未処理の画像を引き続きリーダーで表示できるようにします。

## 認証（任意）

`authenticationEnabled` を `true` にすると、`POST /process` に JWT の Bearer 認証が必要になります。Mankai はユーザー名とパスワードの入力欄を表示し、HTTP プラグインと同じトークンの取得と更新の流れを使用します。

### `POST /auth/login`

**リクエストボディ**

```json
{
  "username": "user",
  "password": "secret"
}
```

**レスポンス — `200 OK`**

```json
{
  "accessToken": "short-lived JWT",
  "refreshToken": "long-lived refresh token"
}
```

### `POST /auth/refresh`

**リクエストボディ**

```json
{
  "refreshToken": "long-lived refresh token"
}
```

**レスポンス — `200 OK`**

```json
{
  "accessToken": "new short-lived JWT"
}
```

認証を使用する処理サービスでは、Mankai は `POST /process` に `Authorization: Bearer <accessToken>` を付けて送信します。`401` または `403` のレスポンスを受け取ると、トークンを 1 回更新し、元のマルチパートリクエストを 1 回再試行します。メタデータと `/auth/*` のエンドポイントでは、Bearer トークンを要求しないでください。

`authenticationEnabled` を省略するか `false` にした場合、認証用エンドポイントの実装は不要です。Mankai は `Authorization` ヘッダーなしで `POST /process` を送信します。
