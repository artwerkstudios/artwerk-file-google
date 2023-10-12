<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Google Cloud Storage plugin for Medusa by artwerk studios UG 
</h1>

<h4 align="center">
  <a href="https://www.artwerk.store">Website</a>
</h4>

<p align="center">
  Medusa Info
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

## Compatibility

This starter is compatible with versions >= 1.17.0 of `@medusajs/medusa`.

## Getting Started

Visit the [Quickstart Guide](https://docs.medusajs.com/create-medusa-app) to set up a Medusa server.

Visit the [Docs](https://docs.medusajs.com/development/backend/prepare-environment) to learn more about the Medusa system requirements.

## Plugin Installation

```
  yarn add artwerk-file-google
```

## Plugin Options

```
  {
    resolve: `artwerk-file-google`,
    options: {
      publicBucket: "<YOUR_PUBLIC_BUCKET>",
      privateBucket: "<YOUR_PUBLIC_BUCKET>",
      keyFileName: "<PATH_TO_CREDENTIALS_JSON>",
    },
  },
```

The public bucket will be called from traditional upload function.
The private bucket will be called from the protected upload function. This bucket is used for files which have restricted access. [See more in Medusa docs creating a file service](https://docs.medusajs.com/development/file-service/create-file-service#using-a-constructor)
The keyFileName has to contain the path to the credentials json. This file can be created in indentity and access manager in the google cloud console.
