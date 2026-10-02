---
title: 遠端圖片處理器
description: 遠端圖片處理器的中繼資料、設定、圖片處理與可選 JWT 認證 API。
---

本規範定義 Mankai 遠端圖片處理器使用的 HTTP API。使用者在**設定 → 圖片處理**中新增伺服器基礎網址。Mankai 讀取處理器中繼資料、顯示伺服器定義的設定欄位，並在處理器啟用時將閱讀器中的每張圖片發送到伺服器。

<span id="endpoints"></span>

## 端點

| 方法   | 路徑            | 認證 | 用途                     |
| :----- | :-------------- | :--- | :----------------------- |
| `GET`  | `/`             | 無需 | 回傳處理器中繼資料和設定 |
| `POST` | `/process`      | 可選 | 處理一張圖片             |
| `POST` | `/auth/login`   | 無需 | 啟用認證時登入           |
| `POST` | `/auth/refresh` | 無需 | 更新存取權杖             |

使用者輸入的網址是基礎網址。例如輸入 `https://images.example.com/mankai` 後，處理端點為 `https://images.example.com/mankai/process`。

<span id="processor-information"></span>

## 處理器資訊

### `GET /`

中繼資料端點必須在無需認證的情況下可用。

**回應 — `200 OK`**

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

`color` 設定使用 sRGB 十六進位字串。預設情況下，顏色選擇器不支援透明度，並儲存大寫的 `#RRGGBB` 值，例如 `"#F2E4C9"`。將 `supportsOpacity` 設為 `true` 可啟用不透明度控制並儲存 `#RRGGBBAA` 值。輸入時可以省略開頭的 `#`。

範例：

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

<span id="image-processing"></span>

## 圖片處理

### `POST /process`

請求使用 `multipart/form-data`，以保留圖片的二進位形式。必須包含以下三個指定名稱的部分。

| 部分      | 內容類型           | 值                                    |
| :-------- | :----------------- | :------------------------------------ |
| `image`   | `image/png`        | 目前處理流程中的圖片，以 PNG 檔案提供 |
| `configs` | `application/json` | 伺服器定義的所有設定項目的目前值      |
| `context` | `application/json` | 閱讀器顯示尺寸，以邏輯點為單位        |

`configs` 使用與 JavaScript 外掛模組設定 API 相同的鍵值結構。

```ts
interface ConfigValue {
  key: string
  value: string | number | boolean
}

type ConfigValues = ConfigValue[]
```

`configs` 部分的範例：

```json
[
  { "key": "strength", "value": 0.8 },
  { "key": "preserveText", "value": true }
]
```

`context` 部分採用以下結構。

```ts
interface ProcessContext {
  pointSize: {
    width: number
    height: number
  }
}
```

伺服器必須直接回傳處理後的圖片，並使用 `2xx` 狀態碼和 `image/*` 類型的 `Content-Type`。允許 PNG、JPEG、WebP、HEIF 以及用戶端平台支援的其他圖片格式。回應會傳遞給下一個已設定的圖片處理器，因此伺服器應保留足夠的解析度和畫質。

非 `2xx` 回應可以回傳簡短的純文字或 JSON 錯誤內文。Mankai 會將本次處理視為失敗，並繼續使用未經此次處理的閱讀器圖片。

<span id="authentication-optional"></span>

## 認證（可選）

將 `authenticationEnabled` 設為 `true`，即可讓 `POST /process` 要求 JWT Bearer 認證。Mankai 隨後顯示使用者名稱和密碼欄位，並使用與 HTTP 外掛模組相同的權杖流程。

### `POST /auth/login`

**請求內文**

```json
{
  "username": "user",
  "password": "secret"
}
```

**回應 — `200 OK`**

```json
{
  "accessToken": "short-lived JWT",
  "refreshToken": "long-lived refresh token"
}
```

### `POST /auth/refresh`

**請求內文**

```json
{
  "refreshToken": "long-lived refresh token"
}
```

**回應 — `200 OK`**

```json
{
  "accessToken": "new short-lived JWT"
}
```

對於啟用認證的處理器，Mankai 在 `POST /process` 中發送 `Authorization: Bearer <accessToken>`。`401` 或 `403` 回應會觸發一次權杖更新，並將原始多部分請求重試一次。中繼資料端點和 `/auth/*` 端點始終無需 Bearer 權杖。

省略 `authenticationEnabled` 或將其設為 `false` 時，無需實作認證端點，Mankai 發送 `POST /process` 時也不會附帶 `Authorization` 標頭。
