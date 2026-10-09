---
title: Add-source links
description: Create Mankai import links and QR codes for one or more JavaScript sources, compatible servers, or server integrations.
sidebar:
  order: 7
---

Create an **Add to Mankai** link so users can preview and install your sources. Users can open the link on a device with Mankai installed, scan a QR code containing it, or paste it into **Import Link**. See the [source guide](/guides/sources/#use-an-add-source-link-or-qr-code) for the app steps.

## Link format

```text
mankai://add-plugins?<type>=<base62-url>&<type>=<base62-url>
```

The scheme is `mankai` and the host is `add-plugins`. Keep this host even though the app calls plugins **sources**. Each query parameter names a source type and contains the Base62 encoding of that source's complete URL. A link can contain multiple parameters, including repeated types.

:::caution[Base62, not Base64]

Source URL values must use **Base62**, not Base64. See [Base62 on Wikipedia](https://en.wikipedia.org/wiki/Base62).

:::

| Parameter  | Source            | URL to encode                                                                           | Optional URL query settings                 |
| ---------- | ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| `js`       | JavaScript        | URL of the [JSON manifest](/api/javascript-plugins/)                                    | Configuration keys declared in the manifest |
| `http`     | Mankai Compatible | Base URL of the [compatible API](/api/http-api/), where the server metadata is returned | `username`, `password`                      |
| `komga`    | Komga Server      | Server base URL                                                                         | `name`, `username`, `password`, `apiKey`    |
| `kavita`   | Kavita Server     | Server base URL                                                                         | `name`, `username`, `password`, `apiKey`    |
| `suwayomi` | Suwayomi Server   | Server base URL                                                                         | `name`, `username`, `password`, `authMode`  |

Use absolute HTTP or HTTPS URLs. File System sources and file shares such as SMB, SFTP, NFS, WebDAV, and OPDS cannot be installed through this link.

## Source settings

Add optional settings to the source URL before encoding it. Keys such as `apiKey` and `authMode` are case-sensitive. For server sources, Mankai extracts the settings and removes the query, URL credentials, and fragment from the server endpoint. For JavaScript sources, Mankai fetches the complete manifest URL and applies query parameters that match its configuration keys.

:::note[Suwayomi authentication]

For Suwayomi, `authMode` accepts `none`, `basic_auth`, `simple_login`, or `ui_login` and defaults to `none`. For authenticated servers, set `authMode` to match the server's authentication mode.

:::

## Share a link

This example links to the JavaScript manifest at `https://example.com/source.json`. Replace the example import URL with your own when publishing.

```html
<a href="mankai://add-plugins?js=5zvbbjSoxv0laUE2U4EGdfjbfzO96x7AOifDkg7Jug"
  >Add to Mankai</a
>
```

Use the complete import URL as an anchor's `href` or as the text of a QR code. When writing a link with multiple sources directly into HTML, escape query separators as `&amp;`. Provide a text link alongside the QR code so users can open or paste it on the same device.

:::caution[Credentials in shared links]

Anyone who receives a link or QR code can read credentials included in it. For public links, leave out passwords and API keys and let users configure them in **Settings → Sources** after adding the source.

:::

## Preview and installation

Mankai loads each source using its specified type. JavaScript manifests and Mankai Compatible server metadata must be reachable for their previews to load. Successfully loaded sources are selected automatically. Users can deselect any they do not want, then tap **Add**.

Invalid entries are skipped. If no usable entries remain, the scanner or pasted-link flow reports an invalid link. An unsupported type or a source that cannot load appears as a failed preview and cannot be selected.

:::note[Duplicate source IDs]

If an installed source or another selected source has the same ID, Mankai asks the user to **Overwrite** or **Cancel**. Avoid including different configurations with the same source ID in a single link.

:::
