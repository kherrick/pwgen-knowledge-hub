# pwgen Knowledge Hub

> WebAssembly password generator compiled for CLI, Custom Elements, ESM, Node.js, and Web App exploration, powered by ShadowClaw.

[![ShadowClaw Version](https://img.shields.io/badge/ShadowClaw-5d7fc4ee-38bdf8)](https://github.com/kherrick/pwgen-knowledge-hub)
[![WASM Engine](https://img.shields.io/badge/WASM-Emscripten-34d399)](https://kherrick.github.io/pwgen/)
[![Custom Element](https://img.shields.io/badge/Web%20Component-%3Cx--pwgen%3E-c084fc)](https://unpkg.com/pwgen)

## 📌 Overview

`pwgen-knowledge-hub` is an interactive documentation platform and demonstration engine built on top of [ShadowClaw](https://github.com/xt-ml/shadow-claw). It showcases **`pwgen`**—the C-based Unix password generator utility compiled to WebAssembly by Karl Herrick.

This repository details:

- **How `pwgen` was built:** Compiling C source code (`pwgen.c`, `pw_phonemes.c`, `pw_rand.c`, `sha1.c`) with Emscripten into optimized WebAssembly bytecode.
- **Why it was built:** Providing standard Unix password security directly to browsers, Node.js, CLI, and Custom Elements with zero external network dependencies or native binary compilation requirements.
- **Evolution of target ecosystems:** Exploring modern ESM + Base64 WASM inlining, Custom Elements (`<x-pwgen>`), as well as historical targets like Chrome Web Bundles (`.wbn`) and Wasmer WAPM.
- **Interactive AI Agent Integration:** Exposing `pwgen` generation controls directly to AI agents via declarative JSON tools and WebMCP BroadcastChannel inter-process communication.

---

## 🚀 Quick Start

### 1. Interactive Web Demo & Knowledge Hub

View the live interactive demo and complete documentation on GitHub Pages:

- [pwgen](https://github.com/kherrick/pwgen)
- [pwgen Knowledge Hub](https://kherrick.github.io/pwgen-knowledge-hub/)

### 2. Command-Line Usage (npx / npm)

Generate passwords instantly on any terminal:

```bash
npx pwgen -sy 20 1
```

### 3. Native Web Component (`<x-pwgen>`)

Embed zero-dependency password generation directly in HTML:

```html
<x-pwgen flags="-sy" length="20" number="1"></x-pwgen>

<script type="module">
  import "https://unpkg.com/pwgen";

  document.addEventListener("x-pwgen-handle-password", ({ detail }) => {
    console.log("Generated Password:", detail.msg);
  });
</script>
```

---

## 📚 Knowledge Hub Chapters

| Chapter                                                                                                 | Title                                            | Description                                                                                   |
| :------------------------------------------------------------------------------------------------------ | :----------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **[Chapter 1](https://kherrick.github.io/pwgen-knowledge-hub/main/about)**                              | Architecture, Origins & WASM Evolution           | History of Theodore Ts'o's C utility and Karl Herrick's WASM port.                            |
| **[Chapter 2](https://kherrick.github.io/pwgen-knowledge-hub/main/cli-and-flags)**                      | CLI Usage, Options & Node.js Integration         | CLI flags reference (`-s`, `-y`, `-0`, `-A`, `-B`, `-v`, `-r`, `-H`) and Node CJS API.        |
| **[Chapter 3](https://kherrick.github.io/pwgen-knowledge-hub/main/wasm-and-compilation)**               | C to WASM Compilation Pipeline                   | Dockerized Emscripten (`emcc`) build scripts & single-file Base64 WASM inlining.              |
| **[Chapter 4](https://kherrick.github.io/pwgen-knowledge-hub/main/custom-element-and-web-integration)** | Native Custom Element (`<x-pwgen>`) & Frameworks | Shadow DOM implementation, event handling, and React/Angular/Vue integration.                 |
| **[Chapter 5](https://kherrick.github.io/pwgen-knowledge-hub/main/historical-targets-wbn-wapm)**        | Historical Evolution: `.wbn` & WAPM              | Exploring Chrome Web Bundles (`.wbn`) and Wasmer WAPM distribution history.                   |
| **[Chapter 6](https://kherrick.github.io/pwgen-knowledge-hub/main/security-entropy-and-sha1)**          | Password Security, Phonetics & SHA1 Seeding      | Phonetic readability vs. pure random entropy ($E = L \times \log_2 N$) and SHA1 file hashing. |
| **[Chapter 7](https://kherrick.github.io/pwgen-knowledge-hub/main/web-platform-and-performance)**       | Web Platform & PWA Performance                   | Workbox Service Worker, sub-millisecond WASM instantiation benchmarks, and PWA setup.         |
| **[Chapter 8](https://kherrick.github.io/pwgen-knowledge-hub/main/agent-skills-and-tools)**             | Agent Skills, Declarative Tools & WebMCP         | Driving `pwgen` parameters from AI agent chat and WebMCP tools.                               |
| **[Memory](https://kherrick.github.io/pwgen-knowledge-hub/main/memory)**                                | Main Technical Memory Reference                  | DeepWiki architecture matrix and component index.                                             |

---

## 🤖 Declarative Agent Tools & WebMCP

`pwgen-knowledge-hub` exposes three declarative tools registered in `site-config.json`:

1. **`pwgen`**: Generates custom passwords via WASM engine. Accepts `flags`, `length`, and `count`.
2. **`pwgen_help`**: Provides human-readable breakdowns of CLI options.
3. **`pwgen_entropy`**: Calculates exact bits of mathematical entropy, pool size, and strength classification.

### Inter-Process BroadcastChannel Bridge (`pwgen-adapter.js`)

Agent tools communicate with the page runtime over the browser's `BroadcastChannel` API (`pwgen-commands` and `pwgen-results`).

```json
{
  "name": "pwgen",
  "parameters": {
    "flags": "-sy",
    "length": 25,
    "count": 2
  }
}
```
