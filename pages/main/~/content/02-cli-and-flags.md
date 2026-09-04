---
title: "Chapter 2: CLI Usage, Options & Node.js Integration"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "cli-and-flags"
---

## Chapter 2: CLI Usage, Options & Node.js Integration

Learn how to execute `pwgen` from the command line via `npx` or globally with `npm`, main command-line options, and integrate `pwgen` into Node.js applications.

### Command-Line Execution

#### Instant Execution with npx

```bash
npx pwgen -sy 20 1
```

Generates one 20-character secure password containing symbols without installing any global packages.

### Global Installation with npm

```bash
npm install -g pwgen
pwgen -sy 25 5
```

Generates 5 secure passwords of length 25.

### Command-Line Flags & Options Reference

`pwgen` supports both short options (e.g. `-s`) and long GNU-style options (e.g. `--secure`):

| Option       | Long Option              | Description                                                       |
| ------------ | ------------------------ | ----------------------------------------------------------------- |
| `-c`         | `--capitalize`           | Include at least one capital letter in the password (Default)     |
| `-A`         | `--no-capitalize`        | Don't include capital letters in the password                     |
| `-n`         | `--numerals`             | Include at least one number in the password (Default)             |
| `-0`         | `--no-numerals`          | Don't include numbers in the password                             |
| `-y`         | `--symbols`              | Include at least one special symbol (e.g. `!@#$%^&*`)             |
| `-s`         | `--secure`               | Generate completely random passwords (overrides phonemes)         |
| `-B`         | `--ambiguous`            | Don't include ambiguous characters (e.g. `0`, `O`, `1`, `l`, `I`) |
| `-r <chars>` | `--remove-chars=<chars>` | Remove specific characters from the generation set                |
| `-v`         | `--no-vowels`            | Do not use any vowels so as to avoid accidental nasty words       |
| `-H <file>`  | `--sha1=<file>`          | Use SHA1 hash of given file as a deterministic random generator   |
| `-C`         | —                        | Print generated passwords in column format                        |
| `-1`         | —                        | Print generated passwords one per line                            |

### Programmatic Integration in Node.js

Install `pwgen` as a dependency in your Node.js project:

```bash
npm install pwgen
```

Use the module programmatically in JavaScript / TypeScript:

```javascript
const pwgen = require("pwgen");

const flags = "-1sy";
const length = "20";
const number = "5";

pwgen({
  arguments: [flags, length, number],
  print: (stdout) => {
    console.log(`Generated Password Output:\n${stdout}`);
  },
});
```

### How CLI Argument Forwarding Works (`src/lib/cli.ts`)

When running via CLI, `src/lib/cli.ts` wraps the compiled WASM module and pre-processes arguments. It specifically inspects process arguments for file hash options (`-H` or `--sha1`), resolves target file paths using Node's `path` module, and forwards formatted argument arrays directly to the WebAssembly main entry point. For AI agents and headless tools, `pwgen.js` provides equivalent argument parsers (`parsePwgenParams`, `parseHelpParams`) that normalize CLI strings and JSON objects alike.

---

[⬅️ Chapter 1: Architecture](/main/about) • [Chapter 3: WASM & Compilation ➡️](/main/wasm-and-compilation)
