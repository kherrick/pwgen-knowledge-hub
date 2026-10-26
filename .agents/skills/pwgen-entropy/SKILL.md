---
name: pwgen-entropy
description: Calculate information entropy (bits) and security rating for any target password.
user-invocable: true
metadata:
  allowed-tools: pwgen_entropy
  execution:
    type: tools
    tools:
      - name: pwgen_entropy
        input: {}
---

# Skill: Calculate Password Entropy (/pwgen-entropy)

Calculate entropy (bits) and security rating for a given password string.

## Usage & Arguments

Triggered via slash command `/pwgen-entropy`.

### Examples

- `/pwgen-entropy MyP@ssw0rd!2026`
