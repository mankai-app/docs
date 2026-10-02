---
title: API 參考
description: 開發可與 Mankai 配合使用的 JavaScript 內容源、HTTP 伺服器、編輯擴充功能和遠端圖片處理器。
sidebar:
  order: 1
prev: false
---

使用這些 API 將你的內容或服務接入 Mankai。根據想要開發的功能，選擇適合的整合方式。

如需瞭解應用程式的設定和使用方法，請閱讀[快速入門](/zh-tw/guides/quick-start/)。

## 選擇整合方式

| 開發目標              | 參考文件                                              | 提供的功能                                                                   |
| :-------------------- | :---------------------------------------------------- | :--------------------------------------------------------------------------- |
| JavaScript 內容源     | [JavaScript 外掛模組](/zh-tw/api/javascript-plugins/) | 使用 JSON 清單和回呼實作瀏覽、搜尋、漫畫詳細資訊、章節和圖片取得。           |
| 漫畫伺服器            | [HTTP 外掛模組 API](/zh-tw/api/http-api/)             | 透過 HTTP 端點提供藏書、認證、搜尋和書庫更新檢查。                           |
| HTTP 內容源的編輯功能 | [編輯器 API](/zh-tw/api/editor-api/)                  | 透過可選端點擴充 HTTP 外掛模組 API，管理漫畫、章節組、章節、封面和頁面圖片。 |
| 遠端圖片處理服務      | [圖片處理器 API](/zh-tw/api/image-processors/)        | 透過可設定的 HTTP 服務處理閱讀器圖片，並可選擇啟用 JWT 認證。                |

## 實作範例

- [plugin](https://github.com/mankai-app/plugin) 提供 JavaScript 內容源外掛模組範例。
- [server](https://github.com/mankai-app/server) 實作了用於漫畫管理和同步的 HTTP API。
