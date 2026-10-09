---
title: 新增來源連結
description: 為一個或多個 JavaScript 來源、Mankai 相容伺服器或伺服器整合建立匯入連結和 QR 碼。
sidebar:
  order: 7
---

建立 **Add to Mankai** 連結，讓使用者預覽並安裝你的來源。使用者可以在已安裝 Mankai 的裝置上打開連結，掃描包含連結的 QR 碼，或貼到**匯入連結**。應用程式內的操作步驟見[來源指南](/zh-tw/guides/sources/#使用新增來源連結或-qr-碼)。

## 連結格式

```text
mankai://add-plugins?<type>=<base62-url>&<type>=<base62-url>
```

協定是 `mankai`，主機名稱是 `add-plugins`。雖然應用程式將外掛模組稱為「來源」，主機名稱仍需保持不變。每個查詢參數的名稱表示來源類型，值是完整來源 URL 的 Base62 編碼。一個連結可包含多個參數，也可以重複同一類型。

:::caution[使用 Base62，請勿使用 Base64]

來源 URL 的值必須使用 **Base62**，不是 Base64。請參閱 [Wikipedia 的 Base62 條目](https://en.wikipedia.org/wiki/Base62)。

:::

| 參數       | 來源            | 要編碼的 URL                                                 | 可選的 URL 查詢設定                        |
| ---------- | --------------- | ------------------------------------------------------------ | ------------------------------------------ |
| `js`       | JavaScript      | [JSON 清單](/zh-tw/api/javascript-plugins/)的 URL            | 清單中宣告的設定鍵                         |
| `http`     | Mankai 相容     | 傳回伺服器中繼資料的[相容 API](/zh-tw/api/http-api/)基礎 URL | `username`、`password`                     |
| `komga`    | Komga 伺服器    | 伺服器基礎 URL                                               | `name`、`username`、`password`、`apiKey`   |
| `kavita`   | Kavita 伺服器   | 伺服器基礎 URL                                               | `name`、`username`、`password`、`apiKey`   |
| `suwayomi` | Suwayomi 伺服器 | 伺服器基礎 URL                                               | `name`、`username`、`password`、`authMode` |

使用絕對 HTTP 或 HTTPS URL。檔案系統來源及 SMB、SFTP、NFS、WebDAV、OPDS 等檔案共用無法透過此連結安裝。

## 來源設定

先將可選設定加入來源 URL，再進行編碼。`apiKey`、`authMode` 等設定鍵區分大小寫。對於伺服器來源，Mankai 會擷取設定，並從伺服器端點移除查詢字串、URL 中的憑證和片段。對於 JavaScript 來源，Mankai 會透過完整的清單 URL 取得內容，並套用與清單設定鍵相符的查詢參數。

:::note[Suwayomi 驗證]

Suwayomi 的 `authMode` 支援 `none`、`basic_auth`、`simple_login` 和 `ui_login`，預設為 `none`。對於需要驗證的伺服器，請將 `authMode` 設為與伺服器一致的驗證模式。

:::

## 分享連結

以下範例連結到 `https://example.com/source.json` 的 JavaScript 清單。發布時，請將範例匯入 URL 替換為你自己的連結。

```html
<a href="mankai://add-plugins?js=5zvbbjSoxv0laUE2U4EGdfjbfzO96x7AOifDkg7Jug"
  >Add to Mankai</a
>
```

將完整的匯入 URL 用作連結元素的 `href` 或 QR 碼文字。將包含多個來源的連結直接寫入 HTML 時，將查詢分隔符跳脫為 `&amp;`。同時提供文字連結，方便使用者在同一裝置上打開或貼上。

:::caution[分享連結中的憑證]

連結或 QR 碼中的憑證可以被接收者讀取。公開連結應省略密碼和 API 金鑰，讓使用者在新增後透過**設定 → 來源**填寫。

:::

## 預覽與安裝

Mankai 會按指定類型載入各來源。JavaScript 清單和 Mankai 相容伺服器中繼資料必須可存取，才能載入預覽。成功載入的來源會自動選取。使用者可以取消選取不需要的來源，再點一下**新增**。

無效項目會被略過。如果沒有可用項目，掃描或貼上連結的流程會提示連結無效。未支援的類型或無法載入的來源會顯示失敗預覽，且無法選取。

:::note[重複的來源 ID]

如果來源 ID 與已安裝來源或另一個所選來源重複，Mankai 會詢問使用者選擇**覆寫**還是**取消**。避免在同一連結中包含 ID 相同而設定不同的來源。

:::
