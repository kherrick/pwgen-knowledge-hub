---
title: "Chapter 5: Historical Evolution: Web Bundles (.wbn) & WAPM Distribution"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "historical-targets-wbn-wapm"
---

## Chapter 5: Historical Evolution: Web Bundles (.wbn) & WAPM Distribution

An exploratory analysis of `pwgen`'s historical git commits, detailing experimental distribution targets including Chrome Web Bundles (`.wbn`) and Wasmer WAPM (WebAssembly Package Manager).

### 📜 Git Archeology & Commit History

An audit of the `pwgen` repository commit history reveals how the project served as an early pioneer for emerging WebAssembly packaging standards:

- `7d4d9dc`: `add wapm manifest` — First inclusion of Wasmer WAPM manifest (`wapm.toml`).
- `8b653d1`: `add wapm install instructions` — Documenting CLI usage via WAPM ecosystem.
- `15a109c`: `setup wbn build` — First integration of Google Web Bundles (`.wbn`) build pipeline.
- `cea2243`: `remove wapm support` — Pruning WAPM as target ecosystems shifted.
- `a7cfa6d`: `remove wbn support` — Consolidating distribution to standard NPM ES Modules and native Custom Elements.

### 🌐 What Were Web Bundles (.wbn)?

Web Bundles (part of the IETF Web Packaging specification) was an experimental format allowing an entire website or web application—including HTML, JavaScript, CSS, WebAssembly, and images—to be bundled into a single binary file (`.wbn`).

#### Why pwgen Evaluated Web Bundles

In 2020, `pwgen` integrated Web Bundles to enable true peer-to-peer distribution of offline password generation. Users could download a single `pwgen.wbn` file, share it via USB or offline Bluetooth, and open it directly in Chrome without requiring an internet connection or web server.

### 📦 What Was Wasmer WAPM?

WAPM (WebAssembly Package Manager) was created by Wasmer as a registry for CLI tools compiled to WebAssembly (WASIX / WASI). It allowed users to run desktop utilities inside sandboxed WebAssembly runtimes without installing native toolchains.

### 💡 Lessons & Modern Synthesis

While `.wbn` and WAPM were valuable exploration steps, the web developer ecosystem ultimately favored standard NPM packaging combined with zero-fetch inline WebAssembly modules (Base64 ESM) and Native Custom Elements (`<x-pwgen>`).

By streamlining distribution to standard npm modules, `pwgen` achieved broader compatibility across Node.js, Webpack, Vite, React, Angular, and modern browser environments without requiring vendor-specific package managers. Today, autonomous discovery has similarly converged on open web standards: rather than bespoke packaging formats, tools and skills are published via standard well-known URIs (`/.well-known/agent-skills/index.json`).

---

[⬅️ Chapter 4: Custom Elements](/main/custom-element-and-web-integration) • [Chapter 6: Security & Entropy ➡️](/main/security-entropy-and-sha1)
