---
title: "Chapter 4: Native Custom Element (&lt;x-pwgen&gt;) & Framework Integration"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "custom-element-and-web-integration"
---

## Chapter 4: Native Custom Element (`<x-pwgen>`) & Framework Integration

Learn how `pwgen` encapsulates WebAssembly password generation into a native Web Component (`<x-pwgen>`) and integrates seamlessly across HTML, React, Angular, Vue, and Svelte.

### 🧱 Custom Element Specification (`XPwgen.ts`)

The custom element is implemented in `src/lib/esm/component/XPwgen.ts` as a class extending `HTMLElement`:

```typescript
import { XPwgen, tagName } from "pwgen";

// Automatically defines <x-pwgen> custom element
if (!customElements.get(tagName)) {
  customElements.define(tagName, XPwgen);
}
```

#### Observed Attributes & Properties

- `flags` (string): Command-line options (e.g. `"-sy"`, `"-0"`, `"-A"`). Default: `"-sy"`
- `length` (string | number): Length of each password. Default: `"20"`
- `number` (string | number): Number of passwords to generate. Default: `"1"`
- `composed` (boolean): Sets event bubbles and composed state for shadow boundary crossing.

### ⚡ Event Handling (`x-pwgen-handle-password`)

When password generation completes, `<x-pwgen>` fires a custom DOM event containing the generated output:

```javascript
document.addEventListener("x-pwgen-handle-password", (event) => {
  console.log("Generated Password Output:", event.detail.msg);
});
```

### 🎨 Framework Usage Examples

#### 1. Vanilla HTML & Script Tag

```html
<x-pwgen composed flags="-sy" length="20" number="1"></x-pwgen>

<script type="module">
  import "https://unpkg.com/pwgen";

  document.addEventListener("x-pwgen-handle-password", ({ detail }) => {
    console.log(detail.msg);
  });
</script>
```

#### 2. React

```jsx
import React from 'react';
import 'pwgen';

const App: React.FC = () => {
  return (
    <div>
      <h2>Password Generator</h2>
      <x-pwgen flags="-sy" length="24" number="1"></x-pwgen>
    </div>
  );
};
export default App;
```

#### 3. Angular

```typescript
import { Component, OnInit } from "@angular/core";
import { pwgen } from "pwgen";

@Component({
  selector: "app-root",
  template: `<div>Generated: {{ password }}</div>`,
})
export class AppComponent implements OnInit {
  password: string = "";

  ngOnInit() {
    pwgen({
      arguments: ["-sy", "20", "1"],
      print: (password: string) => {
        this.password = password;
      },
    });
  }
}
```

### 💅 Shadow DOM & CSS Custom Property Styling

`<x-pwgen>` uses Open Shadow DOM for style isolation while exposing CSS variables for host applications to customize styling without breaking encapsulation:

```css
:root {
  --x-pwgen-display: block;
  --x-pwgen-font-size: 1.1rem;
  --x-pwgen-font-family: "JetBrains Mono", monospace;
  --x-pwgen-ul-list-style: none;
  --x-pwgen-ul-margin: 0;
  --x-pwgen-ul-padding: 0;
  --x-pwgen-li-padding: 0.5rem 0;
}
```

### 🔌 Separation from Core Computation

In modern knowledge hubs, presentation adapters (`.agents/scripts/main/pwgen-adapter.js`) sync `<x-pwgen>` attributes without embedding computation directly inside UI handlers, delegating password generation to decoupled engine modules (`pwgen.js`).

---

[⬅️ Chapter 3: WASM & Compilation](/main/wasm-and-compilation) • [Chapter 5: Historical Targets (.wbn & WAPM) ➡️](/main/historical-targets-wbn-wapm)
