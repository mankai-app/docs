---
title: API reference
description: Build JavaScript plugins, HTTP plugins, editor integrations, and remote image processors for Mankai.
sidebar:
  order: 1
prev: false
---

Use these APIs to connect your content or service to Mankai. Choose the integration that matches what you want to build.

For help setting up and using the app, follow [Quick start](/guides/quick-start/).

## Choose an integration

| Build                             | Reference                                      | What it provides                                                                                                       |
| :-------------------------------- | :--------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| A JavaScript content source       | [JavaScript plugins](/api/javascript-plugins/) | A JSON manifest and callbacks for browsing, search, manga details, chapters, and images.                               |
| A manga server                    | [HTTP plugin API](/api/http-api/)              | HTTP endpoints for serving a collection, authentication, search, and library update checks.                            |
| Editing for an HTTP source        | [Editor API](/api/editor-api/)                 | Optional endpoints that extend the HTTP plugin API to manage manga, chapter groups, chapters, covers, and page images. |
| A remote image processing service | [Image processor API](/api/image-processors/)  | A configurable HTTP service that processes reader images, with optional JWT authentication.                            |

## Example implementations

- [plugin](https://github.com/mankai-app/plugin) contains example JavaScript source plugins.
- [server](https://github.com/mankai-app/server) implements the HTTP API for manga management and syncing.
