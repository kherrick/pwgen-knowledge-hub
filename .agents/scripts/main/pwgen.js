/**
 * pwgen Essential Engine & Tool Logic for ShadowClaw
 * Provides core password generation, entropy calculation, flag parsing,
 * and declarative tool execution handlers for AI agents.
 */

export const CHANNELS = {
  COMMANDS: "pwgen-commands",
  RESULTS: "pwgen-results",
};

export const EVENTS = {
  PASSWORD_GENERATED: "x-pwgen-handle-password",
};

/**
 * All available pwgen CLI flags reference documentation.
 */
export const ALL_FLAGS_EXPLANATION = [
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

/**
 * Helper to parse CLI flag strings into human explanations.
 * Explains specified flags or all flags if none/empty/all specified.
 */
export function explainFlags(flagsString) {
  const rawStr = (flagsString || "").trim();
  const cleanFlags = rawStr.replace(/^-+/, "");

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
export function calculateEntropy(password) {
  if (!password) return { bits: 0, rating: "Empty", poolSize: 0, length: 0 };

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

/**
 * Dynamically loads and caches the pwgen WASM ESM module.
 */
export async function getPwgenModule() {
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

/**
 * Generates passwords directly via the pwgen WASM library module.
 */
export async function generatePassword(flags = "-sy", length = 20, count = 1) {
  const targetFlags = flags || "-sy";
  const targetLength = String(length || 20);
  const targetCount = String(count || 1);

  try {
    const pwgenFn = await getPwgenModule();
    if (pwgenFn) {
      const flagTokens = targetFlags
        ? targetFlags.split(/\s+/).filter(Boolean)
        : [];
      const args = [...flagTokens, targetLength, targetCount];

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
 * Parses parameters for pwgen execution from string, object, or CLI rawInput.
 */
export function parsePwgenParams(params) {
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

  return { flags, length, count };
}

/**
 * Parses parameters for pwgen_help execution.
 */
export function parseHelpParams(params) {
  let flags = "";
  if (typeof params === "string") flags = params.trim();
  else if (params && typeof params === "object") {
    if (params.flags !== undefined && params.flags !== null)
      flags = String(params.flags).trim();
    else if (typeof params.rawInput === "string")
      flags = params.rawInput.trim();
    else if (params.rawInput && typeof params.rawInput.flags === "string")
      flags = params.rawInput.flags.trim();
    else if (params.rawInput && typeof params.rawInput.rawInput === "string")
      flags = params.rawInput.rawInput.trim();
  }
  return flags;
}

/**
 * Parses parameters for pwgen_entropy execution.
 */
export function parseEntropyParams(params) {
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
  return pwd;
}

/**
 * Executes pwgen tool and returns formatted response text.
 */
export async function executePwgen(params) {
  const { flags, length, count } = parsePwgenParams(params);
  const generatedMsg = await generatePassword(flags, length, count);
  return `🔑 Generated Passwords:\n\`\`\`\n${generatedMsg}\n\`\`\`\n\nFlags: ${flags} | Length: ${length} | Count: ${count}`;
}

/**
 * Executes pwgen_help tool and returns formatted explanation text.
 */
export function executePwgenHelp(params) {
  const flags = parseHelpParams(params);
  const cleanStr = flags.replace(/^-+/, "").trim();
  if (
    !cleanStr ||
    cleanStr.toLowerCase() === "all" ||
    cleanStr.toLowerCase() === "help"
  ) {
    return explainFlags("");
  }
  const flagMatch = flags.match(/-[a-zA-Z0-9]+/);
  const targetFlags = flagMatch ? flagMatch[0] : flags;
  const explanation = explainFlags(targetFlags);
  if (explanation.startsWith("📋 All Available")) {
    return explanation;
  }
  return `📋 Flag Breakdown for '${targetFlags}':\n${explanation}`;
}

/**
 * Executes pwgen_entropy tool and returns formatted entropy analysis text.
 */
export function executePwgenEntropy(params) {
  const pwd = parseEntropyParams(params);
  if (!pwd) {
    return `⚠️ Error: Missing required parameter 'password'.\n\nPlease provide a target password string to calculate entropy.\n\nUsage:\n  /pwgen-entropy <password>\n\nExample:\n  /pwgen-entropy MyP@ssw0rd!2026`;
  }
  const res = calculateEntropy(pwd);
  return `📊 Password Entropy Analysis:\n- Password: "${pwd}"\n- Length: ${res.length}\n- Character Set Pool: ${res.poolSize}\n- Entropy: ${res.bits} bits\n- Rating: ${res.rating}`;
}

/**
 * Dispatches and executes a tool command by type.
 */
export async function handleToolCommand(type, params) {
  switch (type) {
    case "pwgen":
      return await executePwgen(params);
    case "pwgen_help":
      return executePwgenHelp(params);
    case "pwgen_entropy":
      return executePwgenEntropy(params);
    default:
      return `Unknown tool command: ${type}`;
  }
}

export default {
  CHANNELS,
  EVENTS,
  ALL_FLAGS_EXPLANATION,
  explainFlags,
  calculateEntropy,
  getPwgenModule,
  generatePassword,
  parsePwgenParams,
  parseHelpParams,
  parseEntropyParams,
  executePwgen,
  executePwgenHelp,
  executePwgenEntropy,
  handleToolCommand,
};
