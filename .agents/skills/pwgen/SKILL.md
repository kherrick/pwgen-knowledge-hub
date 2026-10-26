---
name: pwgen
description: Generate custom secure or phonetic passwords using the WASM pwgen engine with configurable flags, length, and count.
user-invocable: true
metadata:
  allowed-tools: pwgen
  execution:
    type: tools
    tools:
      - name: pwgen
---

# Skill: Generate Password (/pwgen)

Execute password generation via the WASM `pwgen` engine using configurable CLI flags, length, and count parameters.

## Usage & Arguments

Triggered via slash command `/pwgen`.

### Examples

- `/pwgen` (uses defaults: `-sy` 20 1)
- `/pwgen -s 20 20`
- `/pwgen {"flags": "-s", "length": 20, "count": 20}`
