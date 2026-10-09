---
title: 远程图片处理器
description: 远程图片处理器的元数据、配置、图片处理与可选 JWT 认证 API。
---

本规范定义 Mankai 远程图片处理器使用的 HTTP API。用户在**设置 → 图片处理**中添加服务器基础网址。Mankai 读取处理器元数据、显示服务器定义的配置字段，并在处理器启用时将阅读器中的每张图片发送到服务器。

应用中的设置和使用方法请参阅[图片处理](/zh-cn/guides/image-processing/)。

<span id="endpoints"></span>

## 端点

| 方法   | 路径            | 认证 | 用途                   |
| :----- | :-------------- | :--- | :--------------------- |
| `GET`  | `/`             | 无需 | 返回处理器元数据和配置 |
| `POST` | `/process`      | 可选 | 处理一张图片           |
| `POST` | `/auth/login`   | 无需 | 启用认证时登录         |
| `POST` | `/auth/refresh` | 无需 | 刷新访问令牌           |

用户输入的网址是基础网址。例如输入 `https://images.example.com/mankai` 后，处理端点为 `https://images.example.com/mankai/process`。

<span id="processor-information"></span>

## 处理器信息

### `GET /`

:::note[无需认证的元数据端点]

元数据端点必须在无需认证的情况下可用。

:::

**响应 — `200 OK`**

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

:::note[颜色不透明度]

`color` 配置使用 sRGB 十六进制字符串。默认情况下，颜色选择器不支持透明度，并保存大写的 `#RRGGBB` 值，例如 `"#F2E4C9"`。将 `supportsOpacity` 设为 `true` 可启用不透明度控制并保存 `#RRGGBBAA` 值。输入时可以省略开头的 `#`。

:::

示例：

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

## 图片处理

### `POST /process`

请求使用 `multipart/form-data`，以保留图片的二进制形式。必须包含以下三个指定名称的部分。

| 部分      | 内容类型           | 值                                      |
| :-------- | :----------------- | :-------------------------------------- |
| `image`   | `image/png`        | 当前处理流水线中的图片，以 PNG 文件提供 |
| `configs` | `application/json` | 服务器定义的所有配置项的当前值          |
| `context` | `application/json` | 阅读器显示尺寸，以逻辑点为单位          |

`configs` 使用与 JavaScript 插件配置 API 相同的键值结构。

```ts
interface ConfigValue {
  key: string
  value: string | number | boolean
}

type ConfigValues = ConfigValue[]
```

`configs` 部分的示例：

```json
[
  { "key": "strength", "value": 0.8 },
  { "key": "preserveText", "value": true }
]
```

`context` 部分采用以下结构。

```ts
interface ProcessContext {
  pointSize: {
    width: number
    height: number
  }
}
```

服务器必须直接返回处理后的图片，并使用 `2xx` 状态码和 `image/*` 类型的 `Content-Type`。允许 PNG、JPEG、WebP、HEIF 以及客户端平台支持的其他图片格式。响应会传递给下一个已配置的图片处理器，因此服务器应保留足够的分辨率和画质。

:::note[处理失败]

非 `2xx` 响应可以返回简短的纯文本或 JSON 错误体。Mankai 会将本次处理视为失败，并继续使用未经此次处理的阅读器图片。

:::

<span id="authentication-optional"></span>

## 认证（可选）

将 `authenticationEnabled` 设为 `true`，即可让 `POST /process` 要求 JWT Bearer 认证。Mankai 随后显示用户名和密码字段，并使用与 HTTP 插件相同的令牌流程。

### `POST /auth/login`

**请求体**

```json
{
  "username": "user",
  "password": "secret"
}
```

**响应 — `200 OK`**

```json
{
  "accessToken": "short-lived JWT",
  "refreshToken": "long-lived refresh token"
}
```

### `POST /auth/refresh`

**请求体**

```json
{
  "refreshToken": "long-lived refresh token"
}
```

**响应 — `200 OK`**

```json
{
  "accessToken": "new short-lived JWT"
}
```

:::note[认证行为]

对于启用认证的处理器，Mankai 在 `POST /process` 中发送 `Authorization: Bearer <accessToken>`。`401` 或 `403` 响应会触发一次令牌刷新，并将原始多部分请求重试一次。元数据端点和 `/auth/*` 端点始终无需 Bearer 令牌。

省略 `authenticationEnabled` 或将其设为 `false` 时，无需实现认证端点，Mankai 发送 `POST /process` 时也不会附带 `Authorization` 标头。

:::
