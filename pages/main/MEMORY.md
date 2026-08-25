---
title: "Main Technical Memory & Technical Reference"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "memory"
---

## 🧠 pwgen Technical Memory & Architecture Reference

Welcome to the **pwgen Premier Technical Memory & Guide**. This document captures the core WebAssembly compilation pipeline, CLI usage, custom element interfaces, entropy mathematical models, and agent skill execution protocols for `pwgen`.

---

## 🏛️ Project & Ecosystem Resources

- **Live Interactive Demo**: [kherrick.github.io/pwgen](https://kherrick.github.io/pwgen/)
- **Web Components Package**: [x-pwgen-components](https://kherrick.github.io/x-pwgen-components/)
- **Angular Playground App**: [kherrick.github.io/apps](https://kherrick.github.io/apps/playground/x-pwgen-container)
- **GitHub Repository**: [github.com/kherrick/pwgen](https://github.com/kherrick/pwgen)

---

## 🛠️ How-To & Operational Guide

### 1. Generating Passwords & Explaining Security Flags

- **Command-Line CLI**: Run `npx pwgen -sy 20 1` to generate secure, symbol-rich passwords.
- **Phonetic vs. Secure Mode**: Default `pwgen` uses phonetic alternating consonant-vowel combinations (e.g. `xoh7aePh`). Passing `-s` / `--secure` enables true cryptographic randomness across full character spaces.
- **Flag Translation**: Use `/pwgen-help` or the `pwgen_help` tool to break down flags (e.g., `-0` suppresses numbers, `-A` suppresses uppercase, `-v` excludes vowels, `-B` excludes ambiguous characters like `0/O`, `1/l`).

### 2. Calculating Password Entropy

- **Entropy Formula**: $E = L \times \log_2(N)$ where $L$ is length and $N$ is pool size.
- **Tool Usage**: Use `/pwgen-entropy` or the `pwgen_entropy` tool to evaluate string strength, character set complexity, and bits of entropy.

### 3. Agent Skills & Tool Execution Protocol

- **Slash Commands**: `/pwgen`, `/pwgen-help`, and `/pwgen-entropy` execute declaratively via `executeToolChain` without calling LLM prompt models.
- **Stateless BroadcastChannel Bridge**: The adapter (`pwgen-adapter.js`) listens on the `pwgen-commands` channel for `{ type: 'pwgen', requestId, params }` messages and responds over `pwgen-results` with generated passwords and live output updates.

### 4. Custom Web Component (`<x-pwgen>`)

- Import `https://kherrick.github.io/pwgen/dist/lib/esm/component/XPwgen.js`.
- Use tag `<x-pwgen flags="-sy" length="20" number="1"></x-pwgen>` in HTML, React, Angular, or Vue.
- Listen to `x-pwgen-handle-password` custom event (`event.detail.msg`) for password strings.

---

## ⚡ Key Technical Specifications

### WASM Compilation Target Matrix

- **C Source Engine**: `src/pwgen/` (`pwgen.c`, `pw_phonemes.c`, `pw_rand.c`, `randnum.c`, `sha1.c`, `sha1num.c`).
- **Compiler**: Emscripten (Dockerized `trzeci/emscripten:sdk-incoming-64bit`).
- **Browser Distribution**: `dist/lib/esm/pwgen.js` (Zero-fetch Base64 inlined `.wasm` data URI).
- **Node Distribution**: `dist/lib/pwgen.js` (CommonJS loader) + `dist/lib/pwgen.wasm`.

### Declarative Agent Tools

1. `pwgen`: Accepts `flags`, `length`, `count`. Generates passwords in worker/adapter thread.
2. `pwgen_help`: Accepts `flags` string, outputs flag descriptions and security advice.
3. `pwgen_entropy`: Accepts `password` string, outputs pool size, length, entropy bits, and strength rating.

---

⬅️ [Previous Page](/main/agent-skills-and-tools)
