# AGENTS.md — pwgen Knowledge Hub

> Guidance for AI agents working on this site's content.

## Project Snapshot

Static knowledge hub for [pwgen](https://kherrick.github.io/pwgen/), the Unix password generator compiled to WebAssembly, built with [ShadowClaw](https://xt-ml.github.io/shadow-claw/) as the build engine. There is no application source in this repo, only content and configuration.

## Layout

- `pages/main/index.html` — hub home page
- `pages/main/~/content/NN-*.md` — numbered chapters; the filename slug becomes the URL (`/main/<slug>`)
- `pages/main/MEMORY.md`, `pages/main/RESET.md` — agent memory and reset prompt
- `pages/main/theme.css` — site theme
- `pages/resources/` — files copied to the site root (`robots.txt`, `llms.txt`, `AGENTS.md`, `README.md`, `manifest.json`, `404.html`, `assets/`)
- `pages/resources/routes.json` — maps source files to pretty URLs and drives `sitemap.xml` generation
- `shadow-claw.config.json` — site, branding, security, and enabled-tool settings (`pwgen`, `pwgen_help`, `pwgen_entropy`)
- `.agents/` — skills, declarative tools, and scripts (including the `x-pwgen` adapter)

## Conventions

- Add a chapter by creating the markdown file and adding a matching entry to `pages/resources/routes.json`; `sitemap.xml` is generated from it at build time. Do not hand-edit a sitemap.
- Update `llms.txt` when chapters are added, renamed, or removed.
- Only custom elements listed in `customElements.allowedElements` in `shadow-claw.config.json` may be used in pages.
- Keep external requests within the `security.connectSrc` allow-list.
- Treat generated passwords as sensitive; never log or persist them.

## Commands

```bash
npx shadow-claw dev --open   # local dev server on http://127.0.0.1:8888
npx shadow-claw build        # build to dist/public
```

## Reference

- [ShadowClaw AGENTS.md](https://xt-ml.github.io/shadow-claw/AGENTS.md)
- [llms.txt](llms.txt)
