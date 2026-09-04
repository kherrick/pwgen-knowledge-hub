/**
 * pwgen Responsive & Inter-Process Presentation Adapter for ShadowClaw
 * Provides a dynamic communication bridge between ShadowClaw agent tools,
 * BroadcastChannel events, and the <x-pwgen> Web Component / WASM engine.
 *
 * ===========================================================================
 * SKILL EXECUTION MODES: HEADLESS (NON-GRAPHICAL) VS GRAPHICAL
 * ===========================================================================
 * This skill supports two distinct operational modes:
 *
 * 1. HEADLESS / PROGRAMMATIC MODE (Default & Non-Graphical):
 *    - NO DOM, NO HTML markup, and NO custom elements required!
 *    - Ideal for AI agents, background Web Workers, Node.js scripts, and CLI pipelines.
 *    - Method A (Direct ESM Import):
 *        import { generatePasswords, calculateEntropy, handleToolCommand } from "./pwgen.js";
 *        const passwords = await generatePasswords({ flags: "-sy", length: 20, count: 5 });
 *    - Method B (Headless BroadcastChannel IPC):
 *        const cmdChan = new BroadcastChannel("pwgen-commands");
 *        const resChan = new BroadcastChannel("pwgen-results");
 *        resChan.onmessage = ({ data }) => console.log("Result:", data.result);
 *        cmdChan.postMessage({ type: "pwgen", requestId: "1", params: { flags: "-sy", length: 20 } });
 *
 * 2. GRAPHICAL / INTERACTIVE PRESENTATION MODE (Optional DOM Enhancement):
 *    - Used when rendering an interactive visual UI in a web page, iframe,
 *      dashboard, or embedded container (such as ShadowClaw pages or external hubs).
 *    - All DOM elements listed below are OPTIONAL and progressively enhanced:
 *      if any control is omitted from the page, the adapter degrades gracefully.
 *
 *    OPTIONAL MARKUP & DOM PREREQUISITES FOR GRAPHICAL EMBEDDING:
 *    -----------------------------------------------------------------------
 *    a) Target Custom Element (<x-pwgen>):
 *       - Element: <x-pwgen flags="-sy" length="20" number="1" composed></x-pwgen>
 *       - Script: Ensure <x-pwgen> custom element definition is loaded (bundled via
 *         https://kherrick.github.io/pwgen/dist/lib/esm/component/XPwgen.js or pwgen-element.js).
 *       - Listens for attribute changes ('flags', 'length', 'number') and 'pwgen:generate' events.
 *       - Dispatches CustomEvent 'pwgen:password-generated' with { detail: { msg: "..." } }.
 *
 *    b) Live Output Display:
 *       - Element: <div id="pwgen-live-output" class="pwgen-output-box">...</div>
 *       - Purpose: Displays generated password string or error output if <x-pwgen> is outside it.
 *
 *    c) Interactive Length & Count Sliders:
 *       - Password Length:
 *         - Slider: <mwc-slider id="pw-length-slider" min="5" max="50" value="20" ...></mwc-slider> (or <input type="range" id="pw-length-slider">)
 *         - Value Display: <span id="pw-length-val">20</span>
 *       - Password Count:
 *         - Slider: <mwc-slider id="pw-count-slider" min="1" max="10" value="1" ...></mwc-slider> (or <input type="range" id="pw-count-slider">)
 *         - Value Display: <span id="pw-count-val">1</span>
 *
 *    d) Flags & Options Controls:
 *       - Checkboxes with class .pwgen-flag-check and specific IDs/values:
 *         - #pw-flag-c (value="c", Capitalize)
 *         - #pw-flag-A (value="A", No Capitals - mutually exclusive with -c)
 *         - #pw-flag-n (value="n", Numerals)
 *         - #pw-flag-0 (value="0", No Numbers - mutually exclusive with -n)
 *         - #pw-flag-y (value="y", Symbols / Special Characters)
 *         - #pw-flag-s (value="s", Secure Random)
 *         - #pw-flag-B (value="B", Ambiguous Characters)
 *         - #pw-flag-v (value="v", No Vowels)
 *         - #pw-flag-1 (value="1", Single Column Output)
 *       - Exclude Characters Input:
 *         - <mwc-textfield id="pw-remove-chars" ...></mwc-textfield> or <input id="pw-remove-chars">
 *           Value is formatted as flag option `-r<chars>`.
 *
 *    e) Action Buttons:
 *       - Generate: <button id="pwgen-generate-btn">Generate</button> (triggers activeXpwgen.generate())
 *       - Copy: <button id="pwgen-copy-btn">Copy</button> (copies active passwords to navigator.clipboard)
 * ===========================================================================
 */
import { EVENTS, getPwgenModule } from "./pwgen.js";
import { ensureXPwgenDefined, installPwgenBridge } from "./pwgen-element.js";

/**
 * Dynamic Web UI Wiring for interactive controls (sliders, checkboxes, buttons, output)
 *
 * @param {Document|Element} [root=document] - Root container to search for controls.
 */
export function wireInteractiveControls(
  root = typeof document !== "undefined" ? document : null,
) {
  if (!root) return;
  const getEl = (id) =>
    root.getElementById
      ? root.getElementById(id)
      : root.querySelector("#" + id);
  const xpwgen = root.querySelector("x-pwgen");

  const eventTarget = root.addEventListener ? root : globalThis;

  // Listen to custom event emitted by x-pwgen
  eventTarget.addEventListener(EVENTS.PASSWORD_GENERATED, (evt) => {
    const outputDisplay = getEl("pwgen-live-output");
    if (outputDisplay && evt.detail?.msg) {
      // Only set innerText if x-pwgen is not inside outputDisplay (to avoid destroying the component)
      const xpwgenInside = outputDisplay.querySelector("x-pwgen");
      if (!xpwgenInside) {
        outputDisplay.innerText = evt.detail.msg;
      }
    }
  });

  // Helper to extract numeric value from slider event or target
  const getSliderVal = (e, slider, defaultVal) => {
    const raw = e?.detail?.value ?? e?.target?.value ?? slider?.value;
    return Math.round(Number(raw)) || defaultVal;
  };

  // Helper to stop touch swipe navigation bubbling to parent containers
  const stopTouchSwipe = (e) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
  };

  // Wire length slider
  const lengthSlider = getEl("pw-length-slider");
  const lengthVal = getEl("pw-length-val");
  if (lengthSlider && lengthVal) {
    // Input event (dragging): update visual value display only
    const handleLengthInput = (e) => {
      const val = getSliderVal(e, lengthSlider, 20);
      lengthVal.innerText = String(val);
    };

    // Change event (release/commit): update attribute and trigger generation
    const handleLengthChange = (e) => {
      const val = getSliderVal(e, lengthSlider, 20);
      lengthVal.innerText = String(val);
      const activeXpwgen = root.querySelector("x-pwgen") || xpwgen;
      if (activeXpwgen) {
        activeXpwgen.setAttribute("length", String(val));
        activeXpwgen.length = String(val);
      }
    };

    lengthSlider.addEventListener("input", handleLengthInput);
    lengthSlider.addEventListener("change", handleLengthChange);
    lengthSlider.addEventListener("touchstart", stopTouchSwipe, {
      passive: true,
    });
    lengthSlider.addEventListener("touchmove", stopTouchSwipe, {
      passive: true,
    });
  }

  // Wire count slider
  const countSlider = getEl("pw-count-slider");
  const countVal = getEl("pw-count-val");
  if (countSlider && countVal) {
    // Input event (dragging): update visual value display only
    const handleCountInput = (e) => {
      const val = getSliderVal(e, countSlider, 1);
      countVal.innerText = String(val);
    };

    // Change event (release/commit): update attribute and trigger generation
    const handleCountChange = (e) => {
      const val = getSliderVal(e, countSlider, 1);
      countVal.innerText = String(val);
      const activeXpwgen = root.querySelector("x-pwgen") || xpwgen;
      if (activeXpwgen) {
        activeXpwgen.setAttribute("number", String(val));
        activeXpwgen.number = String(val);
      }
    };

    countSlider.addEventListener("input", handleCountInput);
    countSlider.addEventListener("change", handleCountChange);
    countSlider.addEventListener("touchstart", stopTouchSwipe, {
      passive: true,
    });
    countSlider.addEventListener("touchmove", stopTouchSwipe, {
      passive: true,
    });
  }

  // Wire checkboxes & remove-chars input for flags
  const flagCheckboxes = root.querySelectorAll(".pwgen-flag-check");
  const removeCharsInput = getEl("pw-remove-chars");
  const chkC = getEl("pw-flag-c");
  const chkA = getEl("pw-flag-A");
  const chkN = getEl("pw-flag-n");
  const chk0 = getEl("pw-flag-0");

  function updateFlagsFromControls(e) {
    if (e && e.target) {
      const targetId = e.target.id;
      if (targetId === "pw-flag-c" && e.target.checked && chkA) {
        chkA.checked = false;
      } else if (targetId === "pw-flag-A" && e.target.checked && chkC) {
        chkC.checked = false;
      } else if (targetId === "pw-flag-n" && e.target.checked && chk0) {
        chk0.checked = false;
      } else if (targetId === "pw-flag-0" && e.target.checked && chkN) {
        chkN.checked = false;
      }
    }

    let flagChars = "";

    flagCheckboxes.forEach((chk) => {
      const isChecked = Boolean(chk.checked);
      const val = chk.value || chk.getAttribute("value") || "";

      // If Capitalize (-c) is unchecked and No Capitals (-A) is not checked,
      // include 'A' to disable capitals in pwgen
      if (chk.id === "pw-flag-c" && !isChecked && chkA && !chkA.checked) {
        if (!flagChars.includes("A")) flagChars += "A";
        return;
      }

      // If Numerals (-n) is unchecked and No Numbers (-0) is not checked,
      // include '0' to disable numerals in pwgen
      if (chk.id === "pw-flag-n" && !isChecked && chk0 && !chk0.checked) {
        if (!flagChars.includes("0")) flagChars += "0";
        return;
      }

      if (isChecked && val) {
        if (!flagChars.includes(val)) flagChars += val;
      }
    });

    let flagStr = flagChars ? "-" + flagChars : "";

    // Format -r<chars> attached without spaces so getopt handles it as a single token in XPwgen.js
    if (removeCharsInput) {
      const removeVal = (
        removeCharsInput.value ??
        removeCharsInput.getAttribute("value") ??
        ""
      ).trim();
      if (removeVal) {
        flagStr += `r${removeVal}`;
      }
    }

    const activeXpwgen = root.querySelector("x-pwgen") || xpwgen;
    if (activeXpwgen) {
      activeXpwgen.setAttribute("flags", flagStr);
      activeXpwgen.flags = flagStr;
    }
  }

  flagCheckboxes.forEach((chk) => {
    chk.addEventListener("change", updateFlagsFromControls);
    chk.addEventListener("input", updateFlagsFromControls);
    chk.addEventListener("click", updateFlagsFromControls);
  });

  if (removeCharsInput) {
    removeCharsInput.addEventListener("input", updateFlagsFromControls);
    removeCharsInput.addEventListener("change", updateFlagsFromControls);
    removeCharsInput.addEventListener("keyup", updateFlagsFromControls);
  }

  // Wire Generate Button
  const generateBtn = getEl("pwgen-generate-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      const activeXpwgen = root.querySelector("x-pwgen") || xpwgen;
      if (!activeXpwgen) return;
      let checks = 0;
      while (!activeXpwgen.wasmModule && checks < 40) {
        await new Promise((r) => setTimeout(r, 50));
        checks++;
      }
      if (
        activeXpwgen.wasmModule &&
        typeof activeXpwgen.generate === "function"
      ) {
        activeXpwgen.generate();
      } else {
        const curFlags = activeXpwgen.getAttribute("flags") || "-sy";
        activeXpwgen.setAttribute("flags", curFlags);
      }
    });
  }

  // Wire Copy Button
  const copyBtn = getEl("pwgen-copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      let textToCopy = "";
      const activeXpwgen = root.querySelector("x-pwgen") || xpwgen;
      if (activeXpwgen && activeXpwgen.shadowRoot) {
        const ul = activeXpwgen.shadowRoot.querySelector("ul");
        if (ul && ul.innerText.trim()) {
          textToCopy = ul.innerText.trim();
        }
      }
      const outputDisplay = getEl("pwgen-live-output");
      if (!textToCopy && outputDisplay && outputDisplay.innerText.trim()) {
        textToCopy = outputDisplay.innerText.trim();
      }

      if (textToCopy && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(textToCopy);
          const origText =
            copyBtn.getAttribute("label") || copyBtn.label || copyBtn.innerText;
          if ("label" in copyBtn) copyBtn.label = "✓ Copied!";
          else copyBtn.innerText = "✓ Copied!";
          setTimeout(() => {
            if ("label" in copyBtn) copyBtn.label = origText;
            else copyBtn.innerText = origText;
          }, 2000);
        } catch (err) {
          console.error("Clipboard copy failed:", err);
        }
      }
    });
  }
}

/**
 * Initializes the pwgen presentation adapter.
 * Pre-loads WASM module, ensures custom element definition,
 * installs the BroadcastChannel bridge, and wires up interactive UI controls.
 *
 * Does NOT auto-run on import; must be invoked explicitly by the consumer.
 *
 * @param {object} [options]
 * @param {Document|Element} [options.root] - Container to search for controls (defaults to document).
 * @param {boolean} [options.installBridge=true] - Whether to install BroadcastChannel IPC bridge.
 * @param {boolean} [options.wireControls=true] - Whether to wire interactive DOM controls.
 * @returns {void}
 */
export function init(options = {}) {
  const root =
    options.root || (typeof document !== "undefined" ? document : null);

  // Pre-load library module & custom element definitions
  getPwgenModule();
  ensureXPwgenDefined();

  // Install BroadcastChannel bridge for agent tool execution
  if (options.installBridge !== false) {
    installPwgenBridge();
  }

  if (options.wireControls !== false && root) {
    const wire = () => wireInteractiveControls(root);

    if (root.readyState === "loading") {
      root.addEventListener("DOMContentLoaded", wire);
    } else {
      wire();
    }

    // Re-wire controls once custom elements are defined to handle dynamic component upgrades
    if (typeof customElements !== "undefined" && customElements.whenDefined) {
      customElements.whenDefined("x-pwgen").then(wire);
      customElements.whenDefined("mwc-slider").then(wire);
      customElements.whenDefined("mwc-checkbox").then(wire);
      customElements.whenDefined("mwc-textfield").then(wire);
    }
  }
}

export { init as initPwgenAdapter };
export default init;
