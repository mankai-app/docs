---
title: API reference
description: Build JavaScript source plugins, Mankai-compatible servers, editor integrations, remote image processors, and MMA book archives for Mankai.
sidebar:
  order: 1
prev: false
---

Use these APIs and format specifications to connect your content or service to Mankai or create MMA book archives. Choose the reference that matches what you want to build.

Mankai uses plugins internally to communicate with sources. For an HTTP source, implement a compatible server API that Mankai's HTTP plugin can call. For a JavaScript source, provide a JSON manifest and callback scripts.

For help setting up and using the app, follow [Quick start](/guides/quick-start/).

## Choose an integration

| Build                                  | Reference                                      | What it provides                                                                                                             |
| :------------------------------------- | :--------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Source installation links and QR codes | [Add-source links](/api/source-links/)         | A URL format for previewing and adding one or more sources.                                                                  |
| A JavaScript content source            | [JavaScript plugins](/api/javascript-plugins/) | A JSON manifest and callbacks for browsing, search, manga details, chapters, and images.                                     |
| A Mankai-compatible manga server       | [Mankai Compatible API](/api/http-api/)        | Compatible HTTP endpoints called by Mankai's HTTP plugin for browsing, authentication, search, and library update checks.    |
| Editing for a Mankai Compatible source | [Editor API](/api/editor-api/)                 | Optional endpoints that extend the Mankai Compatible API to manage manga, chapter groups, chapters, covers, and page images. |
| A remote image processing service      | [Image processor API](/api/image-processors/)  | A configurable HTTP service that processes reader images, with optional JWT authentication.                                  |
| A portable book archive                | [MMA format](/api/mma-format/)                 | A ZIP archive containing book metadata, chapter groups, and page images.                                                     |

## Example implementations

- [plugin](https://github.com/mankai-app/plugin) contains example JavaScript source plugins.
- [server](https://github.com/mankai-app/server) implements the compatible HTTP API for manga management and syncing.
