import test, { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  wireInteractiveControls,
  init,
} from "../.agents/scripts/main/pwgen-adapter.js";

// Minimal DOM simulation for unit testing
class FakeClassList {
  constructor() {
    this.classes = new Set();
  }
  add(c) {
    this.classes.add(c);
  }
  remove(c) {
    this.classes.delete(c);
  }
  contains(c) {
    return this.classes.has(c);
  }
}

class FakeElement {
  constructor(tagName = "div", id = "") {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.attributes = new Map();
    this.eventListeners = new Map();
    this.children = [];
    this.parentElement = null;
    this.shadowRoot = null;
    this.innerText = "";
    this.value = "";
    this.label = "";
    this.style = {};
    this.classList = new FakeClassList();
  }

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
  }
  getAttribute(k) {
    return this.attributes.get(k) ?? null;
  }
  hasAttribute(k) {
    return this.attributes.has(k);
  }
  removeAttribute(k) {
    this.attributes.delete(k);
  }

  addEventListener(type, handler) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type).push(handler);
  }

  async dispatchEvent(type, eventObj = {}) {
    const handlers = this.eventListeners.get(type) || [];
    for (const h of handlers) {
      await h({ target: this, ...eventObj });
    }
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  querySelector(selector) {
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      if (this.id === id) return this;
      for (const c of this.children) {
        const found = c.querySelector(selector);
        if (found) return found;
      }
      return null;
    }
    if (this.tagName.toLowerCase() === selector.toLowerCase()) {
      return this;
    }
    for (const c of this.children) {
      const found = c.querySelector(selector);
      if (found) return found;
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    if (selector.startsWith(".")) {
      const cls = selector.slice(1);
      if (this.classList.contains(cls)) results.push(this);
    }
    for (const c of this.children) {
      results.push(...c.querySelectorAll(selector));
    }
    return results;
  }

  getElementById(id) {
    return this.querySelector("#" + id);
  }

  select() {
    this._selected = true;
  }
  focus() {
    this._focused = true;
  }
}

describe("pwgen-adapter clipboard copy with fallback", () => {
  let root;
  let copyBtn;
  let liveOutput;
  let fakeDoc;

  beforeEach(() => {
    fakeDoc = new FakeElement("document");
    fakeDoc.body = new FakeElement("body");
    fakeDoc.appendChild(fakeDoc.body);
    fakeDoc.createElement = (tagName) => new FakeElement(tagName);

    root = new FakeElement("div", "root");
    fakeDoc.body.appendChild(root);

    copyBtn = new FakeElement("mwc-button", "pwgen-copy-btn");
    copyBtn.label = "📋 Copy to Clipboard";
    root.appendChild(copyBtn);

    liveOutput = new FakeElement("div", "pwgen-live-output");
    liveOutput.innerText = "SecretPassword123!";
    root.appendChild(liveOutput);

    globalThis.document = fakeDoc;
  });

  function setNavigator(val) {
    Object.defineProperty(globalThis, "navigator", {
      value: val,
      configurable: true,
      writable: true,
    });
  }

  it("copies via navigator.clipboard.writeText when available and permitted", async () => {
    let clipboardText = "";
    setNavigator({
      clipboard: {
        writeText: async (t) => {
          clipboardText = t;
        },
      },
    });

    wireInteractiveControls(root);
    await copyBtn.dispatchEvent("click");

    assert.equal(clipboardText, "SecretPassword123!");
    assert.equal(copyBtn.label, "✓ Copied!");
  });

  it("falls back to document.execCommand('copy') when navigator.clipboard.writeText fails (Permissions Policy NotAllowedError)", async () => {
    setNavigator({
      clipboard: {
        writeText: async () => {
          const err = new Error("Blocked by permissions policy");
          err.name = "NotAllowedError";
          throw err;
        },
      },
    });

    let execCommandCalled = false;
    let copiedText = "";
    fakeDoc.execCommand = (cmd) => {
      if (cmd === "copy") {
        execCommandCalled = true;
        // Textarea appended to document.body should hold the text
        const ta = fakeDoc.body.children.find((c) => c.tagName === "TEXTAREA");
        if (ta) {
          copiedText = ta.value;
        }
        return true;
      }
      return false;
    };

    wireInteractiveControls(root);
    await copyBtn.dispatchEvent("click");

    assert.equal(
      execCommandCalled,
      true,
      "document.execCommand('copy') should be called as fallback",
    );
    assert.equal(copiedText, "SecretPassword123!");
    assert.equal(copyBtn.label, "✓ Copied!");
  });

  it("falls back to document.execCommand('copy') when navigator.clipboard is undefined", async () => {
    setNavigator({});

    let execCommandCalled = false;
    let copiedText = "";
    fakeDoc.execCommand = (cmd) => {
      if (cmd === "copy") {
        execCommandCalled = true;
        const ta = fakeDoc.body.children.find((c) => c.tagName === "TEXTAREA");
        if (ta) {
          copiedText = ta.value;
        }
        return true;
      }
      return false;
    };

    wireInteractiveControls(root);
    await copyBtn.dispatchEvent("click");

    assert.equal(execCommandCalled, true);
    assert.equal(copiedText, "SecretPassword123!");
    assert.equal(copyBtn.label, "✓ Copied!");
  });

  it("initializes controls when root element is passed directly to init(root)", async () => {
    let clipboardText = "";
    setNavigator({
      clipboard: {
        writeText: async (t) => {
          clipboardText = t;
        },
      },
    });

    await init(root);
    await copyBtn.dispatchEvent("click");

    assert.equal(clipboardText, "SecretPassword123!");
    assert.equal(copyBtn.label, "✓ Copied!");
  });
});
