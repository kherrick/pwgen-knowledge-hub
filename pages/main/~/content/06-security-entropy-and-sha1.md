---
title: "Chapter 6: Password Security, Phonetics & Deterministic SHA1 Seeding"
created: "1970-01-01T00:00:00Z"
updated: "1970-01-01T00:00:00Z"
slug: "security-entropy-and-sha1"
---

## Chapter 6: Password Security, Phonetics & Deterministic SHA1 Seeding

Examine the mathematical security principles of `pwgen`, comparing phonetic readability against pure random entropy, and exploring deterministic SHA1 file-seeded password generation.

### 🧠 Phonetic Readability vs. Pure Randomness

`pwgen` provides two fundamental generation modes:

#### 🗣️ Phonetic Mode (Default)

Generates alternating consonant-vowel combinations (e.g. `xoh7aePh`, `ieG8ahPh`). These passwords are easy for humans to pronounce and memorize while preventing standard dictionary attacks.

#### 🔒 Secure Random Mode (`-s`)

Generates completely random character distributions from the full character space. Ideal for server API keys, database secrets, and automated system credentials.

### 📐 Mathematical Password Entropy

Password strength is measured in bits of entropy ($E$), defined by the formula:

```
E = L × log₂ (N)
```

Where:

- $L$ = Length of the password in characters.
- $N$ = Size of the character pool (lowercase, uppercase, numbers, symbols).

#### Entropy Comparison Table

| Length ($L$) | Flags                    | Pool Size ($N$) | Entropy (Bits) | Strength Rating   |
| ------------ | ------------------------ | --------------- | -------------- | ----------------- |
| 8 chars      | Default (Phonetic)       | ~36             | ~41.3 bits     | Moderate ⚠️       |
| 16 chars     | `-sy` (Random + Symbols) | 94              | ~104.9 bits    | Very Strong 💪    |
| 20 chars     | `-sy` (Random + Symbols) | 94              | ~131.1 bits    | Military Grade 🛡️ |
| 32 chars     | `-sy` (Random + Symbols) | 94              | ~209.8 bits    | Unbreakable 🚀    |

### 🔑 Deterministic Password Generation (`-H` / `--sha1`)

One of `pwgen`'s most unique security capabilities is file-seeded deterministic password generation:

```bash
pwgen -H path/to/secret.key#myseed 20 1
```

#### How It Works (`sha1.c` & `sha1num.c`):

1. Reads the specified keyfile or binary seed file.
2. Computes a SHA1 cryptographic hash of the file contents combined with the optional `#seed` string.
3. Uses the resulting 160-bit SHA1 digest to seed the pseudo-random number generator (`pw_sha1_number`).
4. Generates a deterministic password that will always be identical when given the same keyfile and seed, but impossible to reverse engineer.

### 🛡️ Privacy & Zero Trust Security Guarantee

Because `pwgen` compiles entirely into client-side WebAssembly, all password generation occurs in the isolated memory space of the user's browser or local terminal session. No passwords, seeds, or telemetry are ever transmitted across external APIs or servers.

---

[⬅️ Chapter 5: Historical Targets](/main/historical-targets-wbn-wapm) • [Chapter 7: Web Platform & PWA ➡️](/main/web-platform-and-performance)
