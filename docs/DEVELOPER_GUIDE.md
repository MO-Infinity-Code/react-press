# React Press Launcher — Developer Guide

This guide explains how to develop, test, bundle, and build the React Press Launcher as a standalone
Windows executable using Node.js SEA.

> **Important — read before anything else**
>
> Set up the Shared React Environment first:
>
> ```bash
> cd react-press\react\19.2.8
> npm install
> ```

> **Warning: installing packages**
>
> Any new dependency must be installed inside the Shared Environment only:
>
> ```bash
> cd react-press\react\19.2.8
> npm install <package-name>
> ```
>
> Never install packages from inside `projects\react-press` or any other project that depends on the
> shared environment — this breaks the environment structure.

> **Important — MongoDB Community & mongosh**
>
> React Press needs MongoDB Community Server and the MongoDB Shell (`mongosh`) to run locally. Only
> download these from MongoDB's official sources.
>
> **MongoDB Community Server 8.3.8** Official download page:
> https://www.mongodb.com/try/download/community Select:
>
> - Version: `8.3.8`
> - Platform: `Windows x64`
> - Package: `msi`
>
> The file must be named exactly:
>
> ```text
> mongodb-windows-x86_64-8.3.8-signed.msi
> ```
>
> **MongoDB Shell 2.10.0** Official download page: https://www.mongodb.com/try/download/shell
> Select:
>
> - Version: `2.10.0`
> - Platform: `Windows x64`
> - Package: `msi`
>
> The file must be named exactly:
>
> ```text
> mongosh-2.10.0-x64.msi
> ```
>
> MongoDB Community Server and `mongosh` ship as separate products on Windows, so each MSI must be
> downloaded independently.
>
> Place both files exactly in:
>
> ```text
> databases\progs\mongodb\
> ```
>
> The code looks for these exact filenames (it does not scan the folder for "any MSI") — if the name
> differs by even one character or version number, the launcher fails immediately with
> `installer was not found`. To verify the name and location before running:
>
> ```powershell
> Test-Path "databases\progs\mongodb\mongodb-windows-x86_64-8.3.8-signed.msi"
> Test-Path "databases\progs\mongodb\mongosh-2.10.0-x64.msi"
> ```
>
> Both must return `True`.

## Overview

The launcher prepares the React Press environment, checks Rsbuild, starts it if needed, then opens
the browser.

```text
Launcher → Environment Setup → Install/Start MongoDB → Check Rsbuild → Start Rsbuild (if needed) → Wait for localhost:3000 → Open Browser
```

## Requirements

- Windows
- Node.js 20.19+ or 22.12+
- npm
- Git
- MongoDB Community Server 8.3.8 (MSI) — placed in `databases\progs\mongodb\`
- mongosh 2.10.0 (MSI) — placed in `databases\progs\mongodb\`
- At least 2.5 GB free disk space for MongoDB, plus 0.2 GB for mongosh

```bash
node --version
npm --version
```

## Project Structure

```text
react-press/
├── launcher/
│   ├── browser.mjs
│   ├── constants.mjs
│   ├── databaseManager.mjs
│   ├── launcher.js       ← generated file
│   ├── logger.mjs
│   ├── main.js            ← entry point
│   ├── node-error.html
│   ├── rsbuildManager.mjs
│   ├── setup.mjs
│   ├── state.mjs
│   └── utils.mjs
├── scripts/
│   └── setup-environment.js
├── databases/
│   └── progs/
│       └── mongodb/
│           ├── mongodb-windows-x86_64-8.3.8-signed.msi
│           └── mongosh-2.10.0-x64.msi
├── react/
│   └── 19.2.8/node_modules/     ← Shared Environment
├── projects/
│   └── react-press/
│       ├── package.json
│       ├── rsbuild.config.ts
│       ├── src/
│       └── public/
├── dist/
├── sea-config.json
└── Readme.md
```

## Launcher File Responsibilities

| File                  | Responsibility                              |
| --------------------- | ------------------------------------------- |
| `main.js`             | Entry point, orchestrates startup           |
| `launcher.js`         | esbuild bundle output — never edit manually |
| `browser.mjs`         | Opens the browser                           |
| `constants.mjs`       | Shared constants                            |
| `databaseManager.mjs` | Installs and starts MongoDB and mongosh     |
| `logger.mjs`          | Logging                                     |
| `node-error.html`     | Node.js error page                          |
| `rsbuildManager.mjs`  | Detects, starts, and monitors Rsbuild       |
| `setup.mjs`           | Environment setup                           |
| `state.mjs`           | Runtime state                               |
| `utils.mjs`           | Shared utilities                            |

## Shared React Environments (Junctions)

Each React version has its own `node_modules`, shared across all projects using that version:

```text
react/
├── 19.2.8/node_modules/
└── 19.2.9/node_modules/
```

On Windows, projects access the shared environment through a Junction:

```text
projects/react-press/node_modules  →  react/19.2.8/node_modules
```

A Junction is a link, not a physical copy. If it already exists, `scripts/setup-environment.js` will
not recreate it.

## Running the Launcher During Development

```bash
node launcher/main.js
```

Default URL: `http://localhost:3000/`

## Bundling the Launcher (esbuild)

From inside `projects/react-press`:

```bash
npx esbuild ..\..\launcher\main.js --bundle --platform=node --format=esm --outfile=..\..\launcher\launcher.js
```

⚠️ The source is always `main.js` — never edit `launcher.js` by hand, it is overwritten on every
bundle.

## Building the EXE (Node.js SEA)

`sea-config.json`:

```json
{
    "main": "launcher/launcher.js",
    "mainFormat": "module",
    "output": "dist/react-press.exe",
    "disableExperimentalSEAWarning": true
}
```

From the project root:

```bash
node --build-sea sea-config.json
```

Output: `dist/react-press.exe`

## Automated Build

```json
"scripts": {
    "bundle": "esbuild launcher/main.js --bundle --platform=node --format=esm --outfile=launcher/launcher.js",
    "build": "npm run bundle && node --build-sea sea-config.json"
}
```

```bash
npm run build
```

## Testing the Executable

```powershell
.\dist\react-press.exe
```

## Troubleshooting

| Issue                        | Fix                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| Resource Busy / Locked       | Close any running `react-press.exe` or Rsbuild process, then rebuild                                      |
| esbuild can't find `main.js` | Make sure you're in `projects\react-press`, run `Test-Path ..\..\launcher\main.js` (should return `True`) |
| `rsbuild is not recognized`  | Verify the version's environment includes Rsbuild and the project's Junction is correctly linked          |
| Node.js version warning      | Verify `node --version` is compatible with the installed Rsbuild version                                  |
| `installer was not found`    | Confirm MongoDB and mongosh files exist with the exact expected filenames in `databases\progs\mongodb\`   |
| `mongodb-service-missing`    | Check the disk-space message in the log — usually the root or system drive has less than 2.5 GB free      |

## Full Development Cycle

```text
Edit code → node launcher/main.js (test) → esbuild (bundle) → node --build-sea (build) → .\dist\react-press.exe (final test)
```

## Future Architecture

The launcher is the foundation for React Press's local environment management, planned to expand to:

```text
Node Version Manager → React Version Manager → Environment Manager → Theme Manager → Plugin Manager → Project Manager
```

## References

- Node.js SEA: https://nodejs.org/api/single-executable-applications.html
- Node.js Modules: https://nodejs.org/api/modules.html
- Rsbuild: https://rsbuild.dev/guide/
- esbuild: https://esbuild.github.io/
- npm: https://docs.npmjs.com/
- MongoDB Community Server: https://www.mongodb.com/try/download/community
- MongoDB Shell (mongosh): https://www.mongodb.com/try/download/shell
