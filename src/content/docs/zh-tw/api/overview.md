---
title: API 參考
description: 開發可與 Mankai 配合使用的 JavaScript 來源外掛模組、Mankai 相容伺服器、編輯擴充功能和遠端圖片處理器，以及建立 MMA 書籍封存檔。
sidebar:
  order: 1
prev: false
---

使用這些 API 和格式規範將你的內容或服務接入 Mankai，或建立 MMA 書籍封存檔。根據想要建置的內容，選擇適合的參考文件。

Mankai 在內部使用外掛模組與來源互動。HTTP 來源需要實作可供 Mankai HTTP 外掛模組呼叫的相容伺服器 API。JavaScript 來源需要提供 JSON 清單和回呼腳本。

如需瞭解應用程式的設定和使用方法，請閱讀[快速入門](/zh-tw/guides/quick-start/)。

## 選擇整合方式

| 開發目標                  | 參考文件                                              | 提供的功能                                                                        |
| :------------------------ | :---------------------------------------------------- | :-------------------------------------------------------------------------------- |
| 來源安裝連結和 QR 碼      | [新增來源連結](/zh-tw/api/source-links/)              | 預覽並新增一個或多個來源的 URL 格式。                                             |
| JavaScript 來源           | [JavaScript 外掛模組](/zh-tw/api/javascript-plugins/) | 使用 JSON 清單和回呼實作瀏覽、搜尋、漫畫詳細資訊、章節和圖片取得。                |
| Mankai 相容漫畫伺服器     | [Mankai 相容 API](/zh-tw/api/http-api/)               | 透過 Mankai HTTP 外掛模組呼叫的相容 HTTP 端點提供瀏覽、認證、搜尋和書庫更新檢查。 |
| Mankai 相容來源的編輯功能 | [編輯器 API](/zh-tw/api/editor-api/)                  | 透過可選端點擴充 Mankai 相容 API，管理漫畫、章節組、章節、封面和頁面圖片。        |
| 遠端圖片處理服務          | [圖片處理器 API](/zh-tw/api/image-processors/)        | 透過可設定的 HTTP 服務處理閱讀器圖片，並可選擇啟用 JWT 認證。                     |
| 可攜式書籍封存檔          | [MMA 格式](/zh-tw/api/mma-format/)                    | 以 ZIP 封存檔儲存書籍中繼資料、章節群組和頁面圖片。                               |

## 實作範例

- [plugin](https://github.com/mankai-app/plugin) 提供 JavaScript 來源外掛模組範例。
- [server](https://github.com/mankai-app/server) 實作了用於漫畫管理和同步的相容 HTTP API。
