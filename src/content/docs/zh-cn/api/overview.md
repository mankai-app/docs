---
title: API 参考
description: 开发可与 Mankai 配合使用的 JavaScript 内容源、HTTP 服务器、编辑扩展和远程图片处理器，以及创建 MMA 书籍归档。
sidebar:
  order: 1
prev: false
---

使用这些 API 和格式规范将你的内容或服务接入 Mankai，或创建 MMA 书籍归档。根据想要构建的内容，选择适合的参考文档。

如需了解应用的设置和使用方法，请阅读[快速入门](/zh-cn/guides/quick-start/)。

## 选择集成方式

| 开发目标              | 参考文档                                          | 提供的功能                                                               |
| :-------------------- | :------------------------------------------------ | :----------------------------------------------------------------------- |
| JavaScript 内容源     | [JavaScript 插件](/zh-cn/api/javascript-plugins/) | 使用 JSON 清单和回调实现浏览、搜索、漫画详情、章节和图片获取。           |
| 漫画服务器            | [HTTP 插件 API](/zh-cn/api/http-api/)             | 通过 HTTP 端点提供藏书、认证、搜索和书库更新检查。                       |
| HTTP 内容源的编辑功能 | [编辑器 API](/zh-cn/api/editor-api/)              | 通过可选端点扩展 HTTP 插件 API，管理漫画、章节组、章节、封面和页面图片。 |
| 远程图片处理服务      | [图片处理器 API](/zh-cn/api/image-processors/)    | 通过可配置的 HTTP 服务处理阅读器图片，并可选择启用 JWT 认证。            |
| 可移植的书籍归档      | [MMA 格式](/zh-cn/api/mma-format/)                | 以 ZIP 归档保存书籍元数据、章节组和页面图片。                            |

## 实现示例

- [plugin](https://github.com/mankai-app/plugin) 提供 JavaScript 内容源插件示例。
- [server](https://github.com/mankai-app/server) 实现了用于漫画管理和同步的 HTTP API。
