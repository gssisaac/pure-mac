# PureMac

**PureMac** is a native macOS desktop app that scans for hidden, stale, or orphaned files so you can understand what’s using disk space and reclaim it safely.

Built with **[Tauri 2](https://v2.tauri.app/)** (Rust) and **[React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)**, with an opinionated dark UI themed for macOS.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> **Platform:** macOS only. PureMac relies on Spotlight metadata, filesystem layouts, and privacy APIs specific to macOS.

---

## Features

- **Category-based scanning** — dotfile cruft, `node_modules`, dormant apps, orphaned app support data, developer tool caches, system/user caches, browser caches, device backups, and large files.
- **Risk signals** — items are labeled so you can tell what’s generally safe to clear versus what deserves a second look.
- **Dashboard** — disk usage overview and per-category toggles for the next scan.
- **Live scan progress** — streaming updates while the Rust backend walks the filesystem.
- **Results workflow** — filter by category, inspect paths, preview in Finder, select items, then **move to Trash** (default) or **delete permanently** with extra confirmation.
- **Permissions guidance** — Full Disk Access onboarding when macOS blocks reads under `~/Library` and similar paths.
- **Settings** — scan targets, search paths, exclusions, age/size thresholds, and default delete behavior.

PureMac is a **power-user maintenance tool**. Always review selections before deleting. The authors are not responsible for data loss — see [License & disclaimer](#license--disclaimer).

---

## Tech stack

| Layer | Details |
|--------|---------|
| **Desktop shell** | Tauri 2, Rust edition 2021 |
| **UI** | React 19, TypeScript, Vite 7 |
| **Styling** | Custom CSS (dark-first) with small shadcn-style primitives (`Button`, etc.) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Marketing site** | Next.js 15 (`website/`) |

---

## Repository layout

```
pure-mac/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── models.rs
│   │   ├── scanner/          # per-category scanners (dotfiles, node_modules, …)
│   │   └── cleaner/          # Trash vs permanent deletion
│   └── tauri.conf.json
├── src/
│   ├── App.tsx
│   ├── pages/                # Dashboard, Scanner, Results, Settings, …
│   ├── components/
│   ├── store/                # scan + settings state
│   └── lib/                  # Tauri bindings, helpers
└── website/                  # Next.js site (optional separate dev server)
```

---

## Prerequisites

- **macOS** (recommended: current or recent major release)
- [Node.js](https://nodejs.org/) (use an LTS version compatible with Vite 7 / Next.js 15)
- [pnpm](https://pnpm.io/) — this repo expects `pnpm` for installs and workspace scripts
- [Rust toolchain](https://rustup.rs/) stable (for `cargo` / Tauri)

---

## Development

### Install dependencies

```bash
pnpm install
pnpm --dir website install
```

### Run the desktop app (dev)

```bash
pnpm tauri dev
```

The Tauri CLI starts the Vite dev server and opens the PureMac window.

### Build the desktop app

```bash
pnpm tauri:build
```

Release artifacts depend on your Tauri bundle settings (see `src-tauri/tauri.conf.json`).

### Marketing site

```bash
pnpm website:dev
# or
pnpm website:build
```

---

## Configuration & safety

- **Trash by default** — permanent deletion requires explicit choice and confirmation in the UI.
- **Sensitive paths** — scanners apply hard-coded rules and allowlists so critical config (for example SSH and GPG) is never offered as removable clutter.
- **Full Disk Access** — without it, scans may miss or under-report some folders; the app surfaces that state clearly.

Treat any “cleaner” behavior as **at your own risk**: verify paths, maintain backups for anything important, and prefer Trash over permanent deletion until you’re sure.

---

## Contributing

Issues and pull requests are welcome.

1. Fork the repo and create a branch from `main`.
2. Keep changes focused; match existing patterns (`cargo fmt`, project TypeScript strictness).
3. Describe reproduction steps for bugs; for features, outline the UX and macOS considerations.

---

## License & disclaimer

This project is licensed under the [MIT License](./LICENSE).

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND. You are solely responsible for data you delete. Always review items before removal and keep backups of anything you cannot afford to lose.

---

## Maintainer

**Isaac Lee**  
Email: [gssisaac@gmail.com](mailto:gssisaac@gmail.com)  
X: [@ycisaac](https://x.com/ycisaac)

Repository: [github.com/gssisaac/pure-mac](https://github.com/gssisaac/pure-mac)
