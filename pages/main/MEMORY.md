---
title: "Memory Index"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "memory"
---

## 🧠 pwgen Agent Memory Index

Central routing directory for AI agents to locate enabled tools, skills, password features, and subsystem documentation.

---

## 🛠️ Enabled Tools & 🧭 Skills

Enabled via `shadow-claw.config.json` (`enabledTools`) and discoverable headlessly over HTTP via `/.well-known/agent-skills/index.json`.

### Declarative Tools

- **`pwgen`**: Generates custom passwords using the WebAssembly engine
- **`pwgen_help`**: Translates CLI flag strings into human-readable security breakdowns
- **`pwgen_entropy`**: Calculates exact bits of mathematical entropy, pool size, and strength rating

### Agent Skills & Slash Commands

- **`/pwgen`**: Direct password generation workflow
- **`/pwgen-help`**: Flag breakdown & security advice translator
- **`/pwgen-entropy`**: Password strength & entropy calculation

### Architecture & Discovery

- **Core Engine Script (`pwgen.js`)**: Decoupled, portable ESM containing pure computation and tool handlers.
- **Custom Element Factory (`pwgen-element.js`)**: Portable `<x-pwgen>` component factory, attribute syncing, and BroadcastChannel bridge installer.
- **Presentation Adapter (`.agents/scripts/main/pwgen-adapter.js`)**: Bridges on-page custom elements, UI controls, and BroadcastChannel events.
- **Discovery Endpoint**: `/.well-known/agent-skills/index.json` provides RFC-compliant discovery with SHA-256 digests and dependency mapping.

---

## 📚 Complete Documentation Index

- **Chapter 1**: [Architecture, Origins & WebAssembly Evolution](/main/about)
- **Chapter 2**: [CLI Usage, Options & Node.js Integration](/main/cli-and-flags)
- **Chapter 3**: [C to WebAssembly Compilation Pipeline](/main/wasm-and-compilation)
- **Chapter 4**: [Native Custom Element (`<x-pwgen>`) & Framework Integration](/main/custom-element-and-web-integration)
- **Chapter 5**: [Historical Evolution: Web Bundles (.wbn) & WAPM Distribution](/main/historical-targets-wbn-wapm)
- **Chapter 6**: [Password Security, Phonetics & Deterministic SHA1 Seeding](/main/security-entropy-and-sha1)
- **Chapter 7**: [Web Platform Optimization & PWA Performance Engineering](/main/web-platform-and-performance)
- **Chapter 8**: [Agent Skills, Declarative Tools & Slash Commands](/main/agent-skills-and-tools)

---

⬅️ [Previous Page](/main/agent-skills-and-tools)
