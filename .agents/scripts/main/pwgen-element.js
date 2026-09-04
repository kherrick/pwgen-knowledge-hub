/**
 * pwgen Portable Custom Element & UI Mounting Factory
 *
 * Provides reusable web component lifecycle, mounting, attribute syncing,
 * and BroadcastChannel bridge installation for <x-pwgen>.
 * Can be imported and mounted by any external web application, modal dialog,
 * HUD overlay, or knowledge hub.
 */

import {
  CHANNELS,
  EVENTS,
  generatePassword,
  parsePwgenParams,
  executePwgenHelp,
  executePwgenEntropy,
  handleToolCommand,
} from "./pwgen.js";

export const BUNDLE_URLS = [
  "https://kherrick.github.io/pwgen/dist/lib/esm/component/XPwgen.js",
  "https://kherrick.github.io/x-pwgen-components/dist/esm/index.js",
];

/**
 * Ensures the <x-pwgen> custom element is registered in the customElements registry.
 *
 * @returns {Promise<boolean>} Resolves to true if defined.
 */
export async function ensureXPwgenDefined() {
  if (typeof customElements === "undefined") return false;
  if (customElements.get("x-pwgen")) return true;

  for (const url of BUNDLE_URLS) {
    try {
      await import(url);
    } catch (e) {}
    if (customElements.get("x-pwgen")) break;
  }

  if (!customElements.get("x-pwgen")) {
    await customElements.whenDefined("x-pwgen").catch(() => {});
  }
  return Boolean(customElements.get("x-pwgen"));
}

/**
 * Creates and configures an <x-pwgen> DOM element.
 *
 * @param {object} [options]
 * @param {string} [options.flags="-sy"]
 * @param {number|string} [options.length=20]
 * @param {number|string} [options.count=1]
 * @param {Function} [options.onPasswordGenerated]
 * @returns {HTMLElement|null}
 */
export function createXPwgen(options = {}) {
  if (typeof document === "undefined") return null;

  const el = document.createElement("x-pwgen");
  const flags = options.flags || "-sy";
  const length = String(options.length || 20);
  const count = String(options.count || options.number || 1);

  el.setAttribute("flags", flags);
  el.setAttribute("length", length);
  el.setAttribute("number", count);

  if (typeof options.onPasswordGenerated === "function") {
    el.addEventListener(EVENTS.PASSWORD_GENERATED, options.onPasswordGenerated);
  }

  return el;
}

/**
 * Creates and mounts an <x-pwgen> element into a target container.
 *
 * @param {HTMLElement|string} container DOM element or selector to append to.
 * @param {object} [options] Options passed to createXPwgen.
 * @returns {HTMLElement|null}
 */
export function renderXPwgen(container, options = {}) {
  if (typeof document === "undefined") return null;

  const target =
    typeof container === "string"
      ? document.querySelector(container)
      : container;
  if (!target) return null;

  const el = createXPwgen(options);
  if (el) {
    target.appendChild(el);
  }
  return el;
}

/**
 * Synchronizes visible on-page <x-pwgen> element attributes.
 *
 * @param {string} [flags="-sy"]
 * @param {number|string} [length=20]
 * @param {number|string} [count=1]
 * @returns {HTMLElement|null} The updated element, if found.
 */
export function syncVisibleXPwgen(flags, length, count) {
  if (typeof document === "undefined") return null;

  const targetFlags = flags || "-sy";
  const targetLength = String(length || 20);
  const targetCount = String(count || 1);

  const visibleComponent = document.querySelector(
    "x-pwgen:not([style*='display: none'])",
  );
  if (visibleComponent) {
    if (visibleComponent.getAttribute("flags") !== targetFlags) {
      visibleComponent.setAttribute("flags", targetFlags);
    }
    if (visibleComponent.getAttribute("length") !== targetLength) {
      visibleComponent.setAttribute("length", targetLength);
    }
    if (visibleComponent.getAttribute("number") !== targetCount) {
      visibleComponent.setAttribute("number", targetCount);
    }
  }

  return visibleComponent;
}

/**
 * Installs the BroadcastChannel bridge for tool commands.
 *
 * @param {object} [options]
 * @param {string} [options.commandChannelName]
 * @param {string} [options.resultChannelName]
 * @param {boolean} [options.force=false]
 * @returns {BroadcastChannel|null}
 */
export function installPwgenBridge(options = {}) {
  if (typeof globalThis.BroadcastChannel === "undefined") {
    return null;
  }
  if (globalThis._pwgenBridgeInstalled && !options.force) {
    return null;
  }
  globalThis._pwgenBridgeInstalled = true;

  const commandChannelName = options.commandChannelName || CHANNELS.COMMANDS;
  const resultChannelName = options.resultChannelName || CHANNELS.RESULTS;

  const commandChannel = new BroadcastChannel(commandChannelName);
  commandChannel.onmessage = async (evt) => {
    const { type, requestId, params } = evt.data || {};
    if (!type || !requestId) return;

    const resultChannel = new BroadcastChannel(resultChannelName);
    let responseText = "";

    try {
      if (type === "pwgen") {
        const { flags, length, count } = parsePwgenParams(params);
        syncVisibleXPwgen(flags, length, count);
        const generatedMsg = await generatePassword(flags, length, count);
        responseText = `🔑 Generated Passwords:\n\`\`\`\n${generatedMsg}\n\`\`\`\n\nFlags: ${flags} | Length: ${length} | Count: ${count}`;
      } else if (type === "pwgen_help") {
        responseText = executePwgenHelp(params);
      } else if (type === "pwgen_entropy") {
        responseText = executePwgenEntropy(params);
      } else {
        responseText = await handleToolCommand(type, params);
      }
    } catch (err) {
      responseText = `Error executing tool: ${err.message || String(err)}`;
    }

    resultChannel.postMessage({ requestId, result: responseText });
    resultChannel.close();
  };

  return commandChannel;
}

export default {
  BUNDLE_URLS,
  ensureXPwgenDefined,
  createXPwgen,
  renderXPwgen,
  syncVisibleXPwgen,
  installPwgenBridge,
};
