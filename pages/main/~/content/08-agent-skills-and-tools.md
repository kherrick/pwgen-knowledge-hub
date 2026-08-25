---
title: "Chapter 8: Agent Skills, Declarative Tools & Slash Commands"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "agent-skills-and-tools"
---

## Chapter 8: Agent Skills, Declarative Tools & Slash Commands

Learn how ShadowClaw exposes `pwgen` capabilities to chat slash commands, declarative tools, and WebMCP without requiring LLM prompt model calls.

### 🔌 Exposed Declarative Tools

The `pwgen-knowledge-hub` registers three declarative tools in `site-config.json` under `enabledTools` (`.agents/tools/main/`):

#### 1. `pwgen`

Generates custom passwords using the WASM `pwgen` engine.

- **Parameters**:
  - `flags` (string): Options like `-sy`, `-0`, `-A`, `-B`, `-v`. Default: `"-sy"`
  - `length` (integer): Password length in characters. Default: `20`
  - `count` (integer): Number of passwords to generate. Default: `1`

#### 2. `pwgen_help`

Translates CLI flag strings into human-readable security breakdowns.

- **Parameters**:
  - `flags` (string): Options string to explain (e.g. `"-sy"`, `"-0ABv"`). If omitted or empty, explains all available flags.

#### 3. `pwgen_entropy`

Calculates exact bits of mathematical entropy, character set pool size, and strength rating.

- **Parameters**:
  - `password` (string): Password string to evaluate. Required.

### 🤖 Direct Execution Skills & Slash Commands

Each skill defines a declarative `metadata.execution` pipeline in its `SKILL.md` file (`.agents/skills/main/`). This allows slash commands under the `pwgen` namespace to execute tools directly in the worker thread via `executeToolChain`, completely bypassing LLM Prompt API calls:

```yaml
metadata:
  allowed-tools: pwgen
  execution:
    type: tools
    tools:
      - name: pwgen
        input:
          flags: "-sy"
          length: 20
          count: 1
```

#### Slash Command Matrix

| Slash Command    | Skill Directory                     | Declarative Tool | Execution Behavior                            |
| ---------------- | ----------------------------------- | ---------------- | --------------------------------------------- |
| `/pwgen`         | `.agents/skills/main/pwgen`         | `pwgen`          | Direct tool execution (Zero LLM prompt calls) |
| `/pwgen-help`    | `.agents/skills/main/pwgen-help`    | `pwgen_help`     | Direct tool execution (Zero LLM prompt calls) |
| `/pwgen-entropy` | `.agents/skills/main/pwgen-entropy` | `pwgen_entropy`  | Direct tool execution (Zero LLM prompt calls) |

### 📡 Inter-Process BroadcastChannel Communication

ShadowClaw executes tools cleanly by posting messages across frame boundaries using the `BroadcastChannel` API (`pages/main/pwgen-adapter.js`):

```javascript
// 1. Declarative tool dispatches clean event message over BroadcastChannel:
const commandChannel = new BroadcastChannel("pwgen-commands");
commandChannel.postMessage({
  type: "pwgen",
  requestId: "req_12345",
  params: { flags: "-sy", length: 20, count: 1 },
});

// 2. pwgen-adapter.js executes pwgen lib & returns formatted results + updates live UI:
const resultChannel = new BroadcastChannel("pwgen-results");
resultChannel.postMessage({
  requestId: "req_12345",
  result: "🔑 Generated Passwords:\nxoh7aePh8ieG8ahPh\n...",
});
```

---

[⬅️ Chapter 7: Web Platform & Performance](/main/web-platform-and-performance) • [Main Technical Memory ➡️](/main/memory)
