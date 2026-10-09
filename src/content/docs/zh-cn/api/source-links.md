---
title: 添加来源链接
description: 为一个或多个 JavaScript 来源、Mankai 兼容服务器或服务器集成创建导入链接和二维码。
sidebar:
  order: 7
---

创建 **Add to Mankai** 链接，让用户预览并安装你的来源。用户可以在已安装 Mankai 的设备上打开链接，扫描包含链接的二维码，或粘贴到**导入链接**。应用内的操作步骤见[来源指南](/zh-cn/guides/sources/#使用添加来源链接或二维码)。

## 链接格式

```text
mankai://add-plugins?<type>=<base62-url>&<type>=<base62-url>
```

协议是 `mankai`，主机名是 `add-plugins`。虽然应用将插件称为「来源」，主机名仍需保持不变。每个查询参数的名称表示来源类型，值是完整来源 URL 的 Base62 编码。一个链接可包含多个参数，也可以重复同一类型。

:::caution[使用 Base62，勿用 Base64]

来源 URL 的值必须使用 **Base62**，不是 Base64。请参阅 [Wikipedia 的 Base62 条目](https://en.wikipedia.org/wiki/Base62)。

:::

| 参数       | 来源            | 要编码的 URL                                               | 可选的 URL 查询设置                        |
| ---------- | --------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `js`       | JavaScript      | [JSON 清单](/zh-cn/api/javascript-plugins/)的 URL          | 清单中声明的配置键                         |
| `http`     | Mankai 兼容     | 返回服务器元数据的[兼容 API](/zh-cn/api/http-api/)基础 URL | `username`、`password`                     |
| `komga`    | Komga 服务器    | 服务器基础 URL                                             | `name`、`username`、`password`、`apiKey`   |
| `kavita`   | Kavita 服务器   | 服务器基础 URL                                             | `name`、`username`、`password`、`apiKey`   |
| `suwayomi` | Suwayomi 服务器 | 服务器基础 URL                                             | `name`、`username`、`password`、`authMode` |

使用绝对 HTTP 或 HTTPS URL。文件系统来源及 SMB、SFTP、NFS、WebDAV、OPDS 等文件共享无法通过此链接安装。

## 来源配置

先将可选配置加入来源 URL，再进行编码。`apiKey`、`authMode` 等配置键区分大小写。对于服务器来源，Mankai 会提取配置，并从服务器端点移除查询字符串、URL 中的凭据和片段。对于 JavaScript 来源，Mankai 会通过完整的清单 URL 获取内容，并应用与清单配置键匹配的查询参数。

:::note[Suwayomi 认证]

Suwayomi 的 `authMode` 支持 `none`、`basic_auth`、`simple_login` 和 `ui_login`，默认为 `none`。对于需要认证的服务器，请将 `authMode` 设为与服务器一致的认证模式。

:::

## 分享链接

以下示例链接到 `https://example.com/source.json` 的 JavaScript 清单。发布时，请将示例导入 URL 替换为你自己的链接。

```html
<a href="mankai://add-plugins?js=5zvbbjSoxv0laUE2U4EGdfjbfzO96x7AOifDkg7Jug"
  >Add to Mankai</a
>
```

将完整的导入 URL 用作链接元素的 `href` 或二维码文本。将包含多个来源的链接直接写入 HTML 时，将查询分隔符转义为 `&amp;`。同时提供文本链接，方便用户在同一设备上打开或粘贴。

:::caution[分享链接中的凭据]

链接或二维码中的凭据可以被接收者读取。公开链接应省略密码和 API 密钥，让用户在添加后通过**设置 → 来源**填写。

:::

## 预览与安装

Mankai 会按指定类型加载各来源。JavaScript 清单和 Mankai 兼容服务器元数据必须可访问，才能加载预览。成功加载的来源会自动选中。用户可以取消选择不需要的来源，再轻点**添加**。

无效条目会被跳过。如果没有可用条目，扫描或粘贴链接的流程会提示链接无效。未支持的类型或无法加载的来源会显示失败预览，且无法选中。

:::note[重复的来源 ID]

如果来源 ID 与已安装来源或另一个所选来源重复，Mankai 会询问用户选择**覆盖**还是**取消**。避免在同一链接中包含 ID 相同而配置不同的来源。

:::
