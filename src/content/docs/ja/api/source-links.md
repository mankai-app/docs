---
title: ソース追加リンク
description: JavaScript ソース、Mankai 互換サーバー、サーバー連携を追加するインポートリンクと QR コードを作成します。
sidebar:
  order: 7
---

**Add to Mankai** リンクを用意すると、ユーザーはソースを確認してから追加できます。Mankai をインストールしたデバイスでリンクを開くほか、リンクを含む QR コードを読み取ったり、**インポートリンク**に貼り付けたりできます。アプリでの操作は[ソースのガイド](/ja/guides/sources/#インポートリンクや-qr-コードを使う)を参照してください。

## リンクの形式

```text
mankai://add-plugins?<type>=<base62-url>&<type>=<base62-url>
```

スキームは `mankai`、ホストは `add-plugins` です。アプリでは「ソース」と呼びますが、ホスト名は変えません。各クエリパラメーターの名前はソースの種類、値は完全なソース URL を Base62 で符号化した文字列です。同じ種類を繰り返すなど、複数のパラメーターを指定できます。

:::caution[Base64 ではなく Base62]

ソース URL の値には Base64 ではなく **Base62** を使ってください。詳しくは [Wikipedia の Base62 記事](https://en.wikipedia.org/wiki/Base62)を参照してください。

:::

| パラメーター | ソース           | 符号化する URL                                              | URL の任意のクエリ設定                     |
| ------------ | ---------------- | ----------------------------------------------------------- | ------------------------------------------ |
| `js`         | JavaScript       | [JSON マニフェスト](/ja/api/javascript-plugins/)の URL      | マニフェストで宣言した設定キー             |
| `http`       | Mankai 互換      | サーバー情報を返す[互換 API](/ja/api/http-api/)のベース URL | `username`、`password`                     |
| `komga`      | Komgaサーバー    | サーバーのベース URL                                        | `name`、`username`、`password`、`apiKey`   |
| `kavita`     | Kavitaサーバー   | サーバーのベース URL                                        | `name`、`username`、`password`、`apiKey`   |
| `suwayomi`   | Suwayomiサーバー | サーバーのベース URL                                        | `name`、`username`、`password`、`authMode` |

HTTP または HTTPS の絶対 URL を使います。ファイルシステムのソースや、SMB、SFTP、NFS、WebDAV、OPDS などのファイル共有は、このリンクでは追加できません。

## ソースの設定

任意の設定は、符号化する前にソース URL に追加します。`apiKey` や `authMode` などのキーは大文字と小文字を区別します。サーバー型ソースでは、Mankai が設定を取り出し、クエリ、URL 内の認証情報、フラグメントを接続先から除きます。JavaScript ソースでは、完全なマニフェスト URL から取得し、宣言済みの設定キーに一致するクエリを反映します。

:::note[Suwayomi の認証]

Suwayomi の `authMode` は `none`、`basic_auth`、`simple_login`、`ui_login` を指定できます。省略時は `none` です。認証を使うサーバーでは、サーバーの認証方式に合わせて `authMode` を指定してください。

:::

## リンクを共有する

次の例は `https://example.com/source.json` の JavaScript マニフェストへのリンクです。公開する際は、例のインポート URL を自分のものに置き換えてください。

```html
<a href="mankai://add-plugins?js=5zvbbjSoxv0laUE2U4EGdfjbfzO96x7AOifDkg7Jug"
  >Add to Mankai</a
>
```

完全なインポート URL をリンク要素の `href`、または QR コードのテキストとして使います。複数のソースを含むリンクを HTML に直接書く場合は、クエリの区切りを `&amp;` にエスケープします。同じデバイスで開いたり貼り付けたりできるよう、QR コードと一緒にテキストのリンクも用意してください。

:::caution[共有リンク内の認証情報]

リンクや QR コードに含まれる認証情報は、受け取った人が読み取れます。公開するリンクにはパスワードや API キーを含めず、追加後に**設定 → ソース**で入力してもらってください。

:::

## プレビューと追加

Mankai は指定された種類で各ソースを読み込みます。JavaScript のマニフェストと Mankai 互換サーバーの情報は、プレビュー時に取得できる必要があります。読み込めたソースは自動的に選択され、ユーザーは不要なものを外して**追加**をタップします。

無効な項目はスキップされます。有効な項目が残らない場合、スキャンや貼り付けの画面でリンクのエラーが表示されます。未対応の種類や読み込めないソースは失敗したプレビューとして表示され、選択できません。

:::note[ソース ID の重複]

インストール済みのソース、または選択中の別のソースと ID が重複する場合は、**上書き**か**キャンセル**を選ぶ確認が表示されます。同じ ID で異なる設定のソースを、1 つのリンクに含めないようにしてください。

:::
