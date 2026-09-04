---
title: "Chapter 8: Agent Skills, Declarative Tools & Slash Commands"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "agent-skills-and-tools"
---

## Chapter 8: Agent Skills, Declarative Tools & Slash Commands

Learn how ShadowClaw exposes `pwgen` capabilities to AI agents, slash commands, headless runtimes, and external discovery endpoints without requiring LLM prompt model calls.

---

## 📐 Decoupled Architecture: Engine & Presentation

To allow external agents and headless environments to run tools without browser DOM dependencies, `pwgen` separates core computation from UI presentation:

- **Core Engine Script (`pwgen.js`)**: Pure ESM containing password generation, entropy math, flag parsing, and tool execution handlers. Zero DOM or browser dependencies.
- **Custom Element & Bridge Factory (`.agents/scripts/main/pwgen-element.js`)**: Portable `<x-pwgen>` custom element factory, attribute syncing, and BroadcastChannel bridge installer.
- **Presentation Adapter (`.agents/scripts/main/pwgen-adapter.js`)**: Handles on-page visual synchronization, `<x-pwgen>` component attributes, and user interactions (sliders, checkboxes, clipboard).

> [!NOTE]
> **Headless-First by Design**: Graphical presentation is completely optional. All `pwgen` skills and tools run headlessly in AI agent tool runners, Web Workers, Node.js scripts, and CLI pipelines with zero DOM or HTML dependencies. The presentation adapter (`pwgen-adapter.js`) and `<x-pwgen>` custom element exist solely to provide an optional interactive visual GUI when embedded in web pages or dashboards.

---

## 🌐 Agent Skills Discovery via Well-Known URI

External agents and peer ShadowClaw instances discover and consume the skills, declarative tools, and portable scripts headlessly over HTTP via the standard discovery index:

```
/.well-known/agent-skills/index.json
```

Conforming to the [Agent Skills Discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc), this index provides:

- **Relative URL Resolution**: Portable across GitHub Pages, custom domains, or local instances.
- **SHA-256 Digest Integrity**: Verifiable checksums for all artifacts.
- **Complete Dependency Mapping**: Discovers matching tools and executable scripts automatically.

---

## 🔌 Exposed Declarative Tools

The hub registers three declarative tools under `enabledTools`:

### 1. `pwgen`

Generates custom passwords using the WASM engine.

- **Parameters**:
  - `flags` (string): Options like `-sy`, `-0`, `-A`, `-B`, `-v`. Default: `"-sy"`
  - `length` (integer): Password length in characters. Default: `20`
  - `count` (integer): Number of passwords to generate. Default: `1`

### 2. `pwgen_help`

Translates CLI flag strings into human-readable security breakdowns.

- **Parameters**:
  - `flags` (string): Options string to explain (e.g. `"-sy"`, `"-0ABv"`).

### 3. `pwgen_entropy`

Calculates exact bits of mathematical entropy, character set pool size, and strength rating.

- **Parameters**:
  - `password` (string): Password string to evaluate. Required.

---

## 🤖 Direct Execution Skills & Slash Commands

Each skill defines a direct tool pipeline, allowing slash commands to execute tools directly in the worker thread via `executeToolChain`:

| Slash Command    | Skill Name      | Declarative Tool | Execution Behavior                            |
| ---------------- | --------------- | ---------------- | --------------------------------------------- |
| `/pwgen`         | `pwgen`         | `pwgen`          | Direct tool execution (Zero LLM prompt calls) |
| `/pwgen-help`    | `pwgen-help`    | `pwgen_help`     | Direct tool execution (Zero LLM prompt calls) |
| `/pwgen-entropy` | `pwgen-entropy` | `pwgen_entropy`  | Direct tool execution (Zero LLM prompt calls) |

---

## 📡 Inter-Process BroadcastChannel Bridge

ShadowClaw executes tools cleanly across frame boundaries using the browser's `BroadcastChannel` API:

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

### How to Wire Up the Adapter Bridge (`pwgen-adapter.js`)

For other ShadowClaw clients or knowledge hubs looking to replicate this integration, the host presentation adapter uses a resilient listener registration pattern:

```javascript
/**
 * 1. Register BroadcastChannel listeners
 */
function registerBroadcastBridge(channelName, responseChannelName) {
  if (typeof BroadcastChannel === "undefined") return;

  const commandChannel = new BroadcastChannel(channelName);
  commandChannel.onmessage = (evt) => {
    const { type, requestId, params } = evt.data || {};
    if (!type || !requestId) return;

    // Dispatch to imported core logic & reply on response channel
    processToolCommand(type, requestId, params, responseChannelName);
  };
}

/**
 * 2. Guard against duplicate listener installation on page reload / SPA navigation
 */
if (!globalThis._pwgenBridgeInstalled) {
  globalThis._pwgenBridgeInstalled = true;
  registerBroadcastBridge(CHANNELS.COMMANDS, CHANNELS.RESULTS);
}
```

### Processing Tool Commands & Returning Responses

When a command arrives, the adapter executes the imported core functions, optionally updates visible on-page custom element attributes for visual feedback, and posts the result back:

```javascript
async function processToolCommand(type, requestId, params, targetChannelName) {
  const resultChannel = new BroadcastChannel(targetChannelName);
  let responseText = "";

  try {
    if (type === "pwgen") {
      const { flags, length, count } = parsePwgenParams(params);
      // Synchronize visible <x-pwgen> component for visual feedback:
      const el = document.querySelector(
        "x-pwgen:not([style*='display: none'])",
      );
      if (el) {
        el.setAttribute("flags", flags);
        el.setAttribute("length", length);
        el.setAttribute("number", count);
      }
      const generatedMsg = await generatePassword(flags, length, count);
      responseText = `🔑 Generated Passwords:\n\`\`\`\n${generatedMsg}\n\`\`\`\n\nFlags: ${flags} | Length: ${length} | Count: ${count}`;
    } else {
      responseText = await handleToolCommand(type, params);
    }
  } catch (err) {
    responseText = `Error executing tool: ${err.message || String(err)}`;
  }

  // Reply with matching requestId
  resultChannel.postMessage({ requestId, result: responseText });
  resultChannel.close();
}
```

### Enabling in `shadow-claw.config.json`

To activate this bridge in a ShadowClaw site:

```json
{
  "customElements": {
    "scripts": [
      { "src": ".agents/scripts/main/pwgen-adapter.js", "hasInit": true }
    ]
  },
  "enabledTools": ["pwgen", "pwgen_help", "pwgen_entropy"]
}
```

---

[⬅️ Chapter 7: Web Platform & Performance](/main/web-platform-and-performance) • [Main Technical Memory ➡️](/main/memory)
