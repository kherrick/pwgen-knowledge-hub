/**
 * pwgen Responsive & Inter-Process Adapter for ShadowClaw
 * Provides a dynamic communication bridge between ShadowClaw agent tools,
 * BroadcastChannel events, and the <x-pwgen> Web Component / WASM engine.
 */
(function initPwgenAdapter() {
  const CHANNELS = {
    COMMANDS: "pwgen-commands",
    RESULTS: "pwgen-results",
  };

  const EVENTS = {
    PASSWORD_GENERATED: "x-pwgen-handle-password",
  };

  /**
   * Helper to parse CLI flag strings into human explanations.
   * Explains specified flags or all flags if none/empty/all specified.
   */
  function explainFlags(flagsString) {
    const rawStr = (flagsString || "").trim();
    const cleanFlags = rawStr.replace(/^-+/, "");

    const ALL_FLAGS_EXPLANATION = [
      "📋 All Available pwgen CLI Flags Reference:",
      "• 🔒 -s, --secure : Generate completely random passwords (overrides pronounceable phonemes)",
      "• 🗣️ Default (without -s) : Generate pronounceable, phonetic passwords",
      "• 🔤 -c, --capitalize : Include at least one capital letter in the password (Default)",
      "• 🚫 -A, --no-capitalize : Don't include capital letters in the password",
      "• 🔢 -n, --numerals : Include at least one number in the password (Default)",
      "• 🚫 -0, --no-numerals : Don't include numbers in the password",
      "• 🔣 -y, --symbols : Include at least one special symbol (e.g. !@#$%^&*)",
      "• 👁️ -B, --ambiguous : Don't include ambiguous characters (e.g. 0, O, 1, l, I)",
      "• 🙊 -v, --no-vowels : Do not use any vowels so as to avoid accidental offensive words",
      "• ✂️ -r <chars>, --remove-chars : Remove specific characters from the generation set",
      "• 🔑 -H <file>, --sha1 : Use SHA1 hash of given file as deterministic random generator seed",
      "• 🏛️ -C : Print generated passwords in column format",
      "• 📜 -1 : Print generated passwords one per line",
    ].join("\n");

    if (
      !cleanFlags ||
      cleanFlags.toLowerCase() === "all" ||
      cleanFlags.toLowerCase() === "help"
    ) {
      return ALL_FLAGS_EXPLANATION;
    }

    const explanations = [];

    // Check Phonetic vs Random (-s)
    if (cleanFlags.includes("s")) {
      explanations.push("🔒 Pure Random (-s)");
    } else {
      explanations.push("🗣️ Phonetic Pronounceable (default)");
    }

    // Check Capitalization (-c / -A)
    if (cleanFlags.includes("A")) {
      explanations.push("🚫 Capital Letters Excluded (-A)");
    } else if (cleanFlags.includes("c")) {
      explanations.push("🔤 Capital Letters Included (-c)");
    } else {
      explanations.push("🔤 Capital Letters Included (default/ -c)");
    }

    // Check Numerals (-n / -0)
    if (cleanFlags.includes("0")) {
      explanations.push("🚫 Numbers Excluded (-0)");
    } else if (cleanFlags.includes("n")) {
      explanations.push("🔢 Numbers Included (-n)");
    } else {
      explanations.push("🔢 Numbers Included (default/ -n)");
    }

    // Check Symbols (-y)
    if (cleanFlags.includes("y")) {
      explanations.push("🔣 Special Symbols Included (-y)");
    }

    // Check Ambiguous (-B)
    if (cleanFlags.includes("B")) {
      explanations.push("👁️ Ambiguous Characters Omitted (-B)");
    }

    // Check Vowels (-v)
    if (cleanFlags.includes("v")) {
      explanations.push("🙊 Vowels Excluded (-v)");
    }

    // Check Remove Chars (-r)
    if (cleanFlags.includes("r")) {
      explanations.push("✂️ Remove Custom Characters (-r)");
    }

    // Check SHA1 Hash (-H)
    if (cleanFlags.includes("H")) {
      explanations.push("🔑 SHA1 Deterministic Hash (-H)");
    }

    // Check Column Format (-C)
    if (cleanFlags.includes("C")) {
      explanations.push("🏛️ Column Format (-C)");
    }

    // Check One Per Line (-1)
    if (cleanFlags.includes("1")) {
      explanations.push("📜 One Per Line (-1)");
    }

    if (explanations.length === 0) {
      return ALL_FLAGS_EXPLANATION;
    }

    return explanations.join(", ");
  }

  /**
   * Helper to calculate password entropy in bits
   */
  function calculateEntropy(password) {
    if (!password) return { bits: 0, rating: "Empty" };

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    if (poolSize === 0) poolSize = 26;

    const bits = Math.round(password.length * Math.log2(poolSize));
    let rating = "Weak";
    if (bits >= 128) rating = "Military Grade 🛡️";
    else if (bits >= 80) rating = "Very Strong 💪";
    else if (bits >= 60) rating = "Strong 👍";
    else if (bits >= 40) rating = "Moderate ⚠️";

    return { bits, rating, poolSize, length: password.length };
  }

  let pwgenModulePromise = null;
  async function getPwgenModule() {
    if (!pwgenModulePromise) {
      pwgenModulePromise = (async () => {
        try {
          const mod =
            await import("https://kherrick.github.io/pwgen/dist/lib/esm/pwgen.js");
          return mod.default || mod;
        } catch (e) {
          console.warn("Failed to load pwgen module directly:", e);
          return null;
        }
      })();
    }
    return pwgenModulePromise;
  }

  async function ensureXPwgenDefined() {
    if (customElements.get("x-pwgen")) return true;
    try {
      await import("https://kherrick.github.io/pwgen/dist/lib/esm/component/XPwgen.js");
    } catch (e) {}
    try {
      await import("https://kherrick.github.io/x-pwgen-components/dist/esm/index.js");
    } catch (e) {}
    if (!customElements.get("x-pwgen")) {
      await customElements.whenDefined("x-pwgen").catch(() => {});
    }
    return !!customElements.get("x-pwgen");
  }

  // Pre-load library module & custom element definitions on adapter startup
  getPwgenModule();
  ensureXPwgenDefined();

  /**
   * Generates passwords directly via the pwgen WASM library module,
   * while updating any visible on-page <x-pwgen> component for visual sync.
   */
  async function generatePasswordViaModule(flags, length, count) {
    const targetFlags = flags || "-sy";
    const targetLength = String(length || 20);
    const targetCount = String(count || 1);

    // Update any visible on-page component for visual sync/feedback
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

    try {
      const pwgenFn = await getPwgenModule();
      if (pwgenFn) {
        const args = targetFlags
          ? [targetFlags, targetLength, targetCount]
          : [targetLength, targetCount];

        const generatedOutput = await new Promise((resolve) => {
          let output = "";
          let resolved = false;
          const finish = () => {
            if (!resolved) {
              resolved = true;
              resolve(output);
            }
          };

          const instance = pwgenFn({
            arguments: args,
            print: (msg) => {
              if (msg) {
                const passwords = msg.trim().split(/\s+/).filter(Boolean);
                if (passwords.length > 0) {
                  const formatted = passwords.join("\n");
                  output = output ? `${output}\n${formatted}` : formatted;
                }
              }
            },
            postRun: finish,
          });

          // Emscripten attaches a .then method to the module instance which causes
          // JavaScript promise resolution ('await') to enter an infinite loop resolving the thenable.
          // Deleting instance.then breaks the infinite loop and prevents browser lockup.
          if (instance && typeof instance.then === "function") {
            delete instance.then;
          }

          setTimeout(finish, 300);
        });

        if (generatedOutput) {
          return generatedOutput.trim();
        }
      }
    } catch (err) {
      console.warn("Direct pwgen module execution error:", err);
    }

    return `Generated (flags=${targetFlags}, length=${targetLength}, count=${targetCount})`;
  }

  /**
   * Process tool commands received via BroadcastChannel
   */
  async function processToolCommand(
    type,
    requestId,
    params,
    targetChannelName,
  ) {
    const resultChannel = new BroadcastChannel(targetChannelName);
    let responseText = "";

    try {
      if (type === "pwgen") {
        let flags = "-sy";
        let length = 20;
        let count = 1;
        let obj = {};
        let str = "";

        if (typeof params === "string") {
          str = params.trim();
        } else if (params && typeof params === "object") {
          obj = params;
          if (typeof params.rawInput === "string") {
            str = params.rawInput.trim();
          } else if (params.rawInput && typeof params.rawInput === "object") {
            obj = Object.assign({}, params.rawInput, params);
            if (typeof params.rawInput.rawInput === "string") {
              str = params.rawInput.rawInput.trim();
            }
          }
        }

        if (str && str.startsWith("{") && str.endsWith("}")) {
          try {
            const parsed = JSON.parse(str);
            if (parsed && typeof parsed === "object") {
              obj = Object.assign({}, parsed, obj);
              str = "";
            }
          } catch (e) {}
        }

        if (
          obj.flags !== undefined &&
          obj.flags !== null &&
          String(obj.flags).trim()
        ) {
          flags = String(obj.flags).trim();
        }
        if (
          obj.length !== undefined &&
          obj.length !== null &&
          !isNaN(Number(obj.length))
        ) {
          length = Number(obj.length);
        }
        if (
          obj.count !== undefined &&
          obj.count !== null &&
          !isNaN(Number(obj.count))
        ) {
          count = Number(obj.count);
        } else if (
          obj.number !== undefined &&
          obj.number !== null &&
          !isNaN(Number(obj.number))
        ) {
          count = Number(obj.number);
        }

        if (str) {
          const flagMatches = str.match(/-[a-zA-Z0-9]+/g);
          if (flagMatches && flagMatches.length > 0) {
            flags = flagMatches.join("");
          }
          const strippedStr = str.replace(/-[a-zA-Z0-9]+/g, " ");
          const numberMatches = strippedStr.match(/\b\d+\b/g);
          if (numberMatches && numberMatches.length > 0) {
            const parsedLen = Number(numberMatches[0]);
            if (!isNaN(parsedLen) && parsedLen > 0) length = parsedLen;
            if (numberMatches.length > 1) {
              const parsedCount = Number(numberMatches[1]);
              if (!isNaN(parsedCount) && parsedCount > 0) count = parsedCount;
            }
          }
        }

        const generatedMsg = await generatePasswordViaModule(
          flags,
          length,
          count,
        );
        responseText = `🔑 Generated Passwords:\n\`\`\`\n${generatedMsg}\n\`\`\`\n\nFlags: ${flags} | Length: ${length} | Count: ${count}`;
      } else if (type === "pwgen_help") {
        let flags = "";
        if (typeof params === "string") flags = params.trim();
        else if (params && typeof params === "object") {
          if (params.flags !== undefined && params.flags !== null)
            flags = String(params.flags).trim();
          else if (typeof params.rawInput === "string")
            flags = params.rawInput.trim();
          else if (params.rawInput && typeof params.rawInput.flags === "string")
            flags = params.rawInput.flags.trim();
          else if (
            params.rawInput &&
            typeof params.rawInput.rawInput === "string"
          )
            flags = params.rawInput.rawInput.trim();
        }
        const cleanStr = flags.replace(/^-+/, "").trim();
        if (
          !cleanStr ||
          cleanStr.toLowerCase() === "all" ||
          cleanStr.toLowerCase() === "help"
        ) {
          responseText = explainFlags("");
        } else {
          const flagMatch = flags.match(/-[a-zA-Z0-9]+/);
          const targetFlags = flagMatch ? flagMatch[0] : flags;
          const explanation = explainFlags(targetFlags);
          if (explanation.startsWith("📋 All Available")) {
            responseText = explanation;
          } else {
            responseText = `📋 Flag Breakdown for '${targetFlags}':\n${explanation}`;
          }
        }
      } else if (type === "pwgen_entropy") {
        let pwd = "";
        let str = "";

        if (typeof params === "string") {
          str = params.trim();
        } else if (params && typeof params === "object") {
          if (params.password !== undefined && params.password !== null) {
            pwd = String(params.password).trim();
          }
          if (typeof params.rawInput === "string") {
            str = params.rawInput.trim();
          } else if (params.rawInput && typeof params.rawInput === "object") {
            if (typeof params.rawInput.password === "string") {
              pwd = params.rawInput.password.trim();
            } else if (typeof params.rawInput.rawInput === "string") {
              str = params.rawInput.rawInput.trim();
            }
          }
        }

        if (!pwd && str) {
          if (str.startsWith("{") && str.endsWith("}")) {
            try {
              const parsed = JSON.parse(str);
              if (parsed && typeof parsed === "object") {
                if (parsed.password) pwd = String(parsed.password).trim();
                else if (parsed.rawInput) pwd = String(parsed.rawInput).trim();
              }
            } catch (e) {}
          }
          if (!pwd) {
            pwd = str;
          }
        }

        if (!pwd) {
          responseText = `⚠️ Error: Missing required parameter 'password'.\n\nPlease provide a target password string to calculate entropy.\n\nUsage:\n  /pwgen-entropy <password>\n\nExample:\n  /pwgen-entropy MyP@ssw0rd!2026`;
        } else {
          const res = calculateEntropy(pwd);
          responseText = `📊 Password Entropy Analysis:\n- Password: "${pwd}"\n- Length: ${res.length}\n- Character Set Pool: ${res.poolSize}\n- Entropy: ${res.bits} bits\n- Rating: ${res.rating}`;
        }
      } else {
        responseText = `Unknown tool command: ${type}`;
      }
    } catch (err) {
      responseText = `Error executing tool: ${err.message || String(err)}`;
    }

    resultChannel.postMessage({ requestId, result: responseText });
    resultChannel.close();
  }

  /**
   * Register BroadcastChannel listeners
   */
  function registerBroadcastBridge(channelName, responseChannelName) {
    if (typeof BroadcastChannel === "undefined") return;
    const commandChannel = new BroadcastChannel(channelName);
    commandChannel.onmessage = (evt) => {
      const { type, requestId, params } = evt.data || {};
      if (!type || !requestId) return;
      processToolCommand(type, requestId, params, responseChannelName);
    };
  }

  if (!window._pwgenBridgeInstalled) {
    window._pwgenBridgeInstalled = true;
    registerBroadcastBridge(CHANNELS.COMMANDS, CHANNELS.RESULTS);
  }

  /**
   * Dynamic Web UI Wiring for index.html
   */
  function wireInteractiveControls() {
    const xpwgen = document.querySelector("x-pwgen");

    // Listen to custom event emitted by x-pwgen
    document.addEventListener(EVENTS.PASSWORD_GENERATED, (evt) => {
      const outputDisplay = document.getElementById("pwgen-live-output");
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
    const lengthSlider = document.getElementById("pw-length-slider");
    const lengthVal = document.getElementById("pw-length-val");
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
        const activeXpwgen = document.querySelector("x-pwgen") || xpwgen;
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
    const countSlider = document.getElementById("pw-count-slider");
    const countVal = document.getElementById("pw-count-val");
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
        const activeXpwgen = document.querySelector("x-pwgen") || xpwgen;
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

    // Wire checkboxes for flags
    const flagCheckboxes = document.querySelectorAll(".pwgen-flag-check");
    function updateFlagsFromCheckboxes() {
      let flags = "-";
      flagCheckboxes.forEach((chk) => {
        const isChecked = Boolean(chk.checked || chk.hasAttribute("checked"));
        const val = chk.value || chk.getAttribute("value") || "";
        if (isChecked && val) flags += val;
      });
      const newFlags = flags !== "-" ? flags : "";
      const activeXpwgen = document.querySelector("x-pwgen") || xpwgen;
      if (activeXpwgen) {
        activeXpwgen.setAttribute("flags", newFlags);
        activeXpwgen.flags = newFlags;
      }
    }

    flagCheckboxes.forEach((chk) => {
      chk.addEventListener("change", updateFlagsFromCheckboxes);
      chk.addEventListener("input", updateFlagsFromCheckboxes);
      chk.addEventListener("click", updateFlagsFromCheckboxes);
    });

    // Wire Generate Button
    const generateBtn = document.getElementById("pwgen-generate-btn");
    if (generateBtn) {
      generateBtn.addEventListener("click", async () => {
        const activeXpwgen = document.querySelector("x-pwgen") || xpwgen;
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
    const copyBtn = document.getElementById("pwgen-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        let textToCopy = "";
        const activeXpwgen = document.querySelector("x-pwgen") || xpwgen;
        if (activeXpwgen && activeXpwgen.shadowRoot) {
          const ul = activeXpwgen.shadowRoot.querySelector("ul");
          if (ul && ul.innerText.trim()) {
            textToCopy = ul.innerText.trim();
          }
        }
        const outputDisplay = document.getElementById("pwgen-live-output");
        if (!textToCopy && outputDisplay && outputDisplay.innerText.trim()) {
          textToCopy = outputDisplay.innerText.trim();
        }

        if (textToCopy && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(textToCopy);
            const origText =
              copyBtn.getAttribute("label") ||
              copyBtn.label ||
              copyBtn.innerText;
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireInteractiveControls);
  } else {
    wireInteractiveControls();
  }

  // Re-wire controls once custom elements are defined to handle dynamic component upgrades
  if (typeof customElements !== "undefined" && customElements.whenDefined) {
    customElements.whenDefined("x-pwgen").then(wireInteractiveControls);
    customElements.whenDefined("mwc-slider").then(wireInteractiveControls);
    customElements.whenDefined("mwc-checkbox").then(wireInteractiveControls);
  }
})();
