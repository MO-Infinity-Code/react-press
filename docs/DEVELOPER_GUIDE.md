# React Press Launcher — Developer Guide

This guide explains how to develop, test, bundle, and build the React Press Launcher as a standalone
Windows executable using Node.js SEA.

## Overview

React Press Launcher is responsible for preparing the local React Press environment, starting the
Vite development server when required, waiting for the application to become available, and opening
the default browser.

The startup flow is:

```text
React Press Launcher
        ↓
Environment Setup
        ↓
Check Vite
        ↓
Start Vite if required
        ↓
Wait for localhost:3000
        ↓
Open Browser
```

The launcher is designed to handle the local startup process automatically without requiring the
user to manually execute the normal development commands.

## Requirements

The development machine should have:

- Windows
- Node.js 20.19+ or 22.12+
- npm
- Git

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

A global installation of esbuild is not required.

The launcher is bundled using:

```bash
npx esbuild
```

## Project Structure

The current launcher structure is:

```text
react-press/
│
├── launcher/
│   ├── browser.mjs
│   ├── constants.mjs
│   ├── launcher.js
│   ├── logger.mjs
│   ├── main.js
│   ├── setup.mjs
│   ├── state.mjs
│   ├── utils.mjs
│   └── viteManager.mjs
│
├── scripts/
│   └── setup-environment.js
│
├── react/
│   └── 19.2.8/
│       └── node_modules/
│
├── projects/
│   └── react-press/
│       ├── package.json
│       ├── index.html
│       ├── vite.config.ts
│       ├── src/
│       ├── public/
│       └── ...
│
├── dist/
│
├── sea-config.json
└── package.json
```

## Launcher Modules

The launcher source is divided into focused modules.

### `main.js`

The main source entry point for the launcher.

It coordinates the launcher startup flow and connects the different modules.

### `launcher.js`

The generated bundled launcher.

This file is produced by esbuild from `main.js` and its imported modules.

It should normally be treated as a generated file.

### `browser.mjs`

Responsible for opening the React Press development URL in the default browser.

### `constants.mjs`

Contains shared constants used throughout the launcher.

### `logger.mjs`

Provides the logging functionality used by the launcher.

### `setup.mjs`

Responsible for environment setup operations before Vite starts.

### `state.mjs`

Stores and manages launcher runtime state.

### `utils.mjs`

Contains shared utility functions used by multiple launcher modules.

### `viteManager.mjs`

Responsible for detecting, starting, and monitoring the Vite development server.

## React Environments

React Press stores React environments separately by version.

Example:

```text
react/
├── 19.2.8/
│   └── node_modules/
│
└── 19.2.9/
    └── node_modules/
```

Each environment represents the dependency tree associated with a specific React version.

The environment is shared between projects that use the same React version.

The goal is to avoid downloading the same dependency tree repeatedly for every project.

## Projects

Each generated project maintains its own project configuration.

Example:

```text
projects/
└── react-press/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── src/
    └── public/
```

Project-level configuration remains separate from the shared React environment.

## Junctions

On Windows, React Press can expose the shared environment through a Junction.

Example:

```text
projects/react-press/node_modules
        ↓
react/19.2.8/node_modules
```

The Junction does not create a second physical copy of the dependency files.

It allows Node.js and development tools to resolve dependencies through the expected project-level
`node_modules` path.

## Environment Setup

Environment preparation is handled by the launcher setup layer.

The current environment setup script is:

```text
scripts/setup-environment.js
```

The setup flow is:

```text
Launcher
    ↓
Environment Setup
    ↓
Check Shared Environment
    ↓
Create Junction if required
```

If the required Junction already exists, it should not be recreated unnecessarily.

## Running the Launcher During Development

The source launcher is started from the project root:

```bash
node launcher/main.js
```

The expected startup flow is:

```text
Run Environment Setup
        ↓
Check localhost:3000
        ↓
If Vite is already running
        ↓
Open Browser

Otherwise
        ↓
npm run dev
        ↓
Wait for localhost:3000
        ↓
Open Browser
```

The default development URL is:

```text
http://localhost:3000/
```

## Bundling the Launcher

The launcher source entry point is:

```text
launcher/main.js
```

The generated bundle is:

```text
launcher/launcher.js
```

Navigate to the React project directory:

```bash
cd react-press\projects\react-press
```

Run:

```bash
npx esbuild ..\..\launcher\main.js --bundle --platform=node --format=esm --outfile=..\..\launcher\launcher.js
```

The bundling process is:

```text
launcher/main.js
        ↓
      esbuild
        ↓
launcher/launcher.js
```

esbuild automatically includes the modules imported by `main.js`.

This includes modules such as:

```text
browser.mjs
constants.mjs
logger.mjs
setup.mjs
state.mjs
utils.mjs
viteManager.mjs
```

Do not use `launcher/launcher.js` as the source entry point for the bundle.

The source entry point is always:

```text
launcher/main.js
```

The generated output is:

```text
launcher/launcher.js
```

## SEA Configuration

The `sea-config.json` file should reference the generated launcher bundle:

```json
{
    "main": "launcher/launcher.js",
    "mainFormat": "module",
    "output": "dist/react-press.exe",
    "disableExperimentalSEAWarning": true
}
```

## Building the Executable

After generating `launcher/launcher.js`, return to the React Press root:

```bash
cd ..\..
```

Then run:

```bash
node --build-sea sea-config.json
```

The generated executable will be:

```text
dist/react-press.exe
```

The complete build pipeline is:

```text
launcher/main.js
        ↓
esbuild
        ↓
launcher/launcher.js
        ↓
Node.js SEA
        ↓
dist/react-press.exe
```

## Automated Build

The build can be automated using npm scripts.

Example:

```json
{
    "scripts": {
        "bundle": "esbuild launcher/main.js --bundle --platform=node --format=esm --outfile=launcher/launcher.js",
        "build": "npm run bundle && node --build-sea sea-config.json"
    }
}
```

Then run:

```bash
npm run build
```

## Testing the Executable

After a successful build:

```text
dist/
└── react-press.exe
```

Run:

```powershell
.\dist\react-press.exe
```

Expected workflow:

```text
react-press.exe
        ↓
Environment Setup
        ↓
Check Vite
        ↓
Start Vite if required
        ↓
localhost:3000
        ↓
Default Browser
```

## Troubleshooting

### Resource Busy or Locked

If Node.js SEA reports that a resource is busy or locked, close any running `react-press.exe`
process before rebuilding.

Also stop any running Vite process when necessary.

### esbuild Cannot Resolve `main.js`

Make sure the command is executed from:

```text
react-press\projects\react-press
```

Verify the source file:

```powershell
Test-Path ..\..\launcher\main.js
```

The expected result is:

```text
True
```

Then run:

```bash
npx esbuild ..\..\launcher\main.js --bundle --platform=node --format=esm --outfile=..\..\launcher\launcher.js
```

### `vite` Is Not Recognized

If the launcher reports:

```text
vite is not recognized
```

verify that the selected React environment contains Vite and that the project can resolve its shared
dependencies.

### Node.js Version Warning

Check the installed Node.js version:

```bash
node --version
```

The Node.js version used by the launcher and the Vite development server must satisfy the
requirements of the installed Vite version.

## Development Workflow

The recommended workflow is:

```text
Modify Launcher Source
        ↓
Run Launcher Locally
        ↓
Test React Press
        ↓
Bundle with esbuild
        ↓
Build SEA
        ↓
Test react-press.exe
```

Run locally:

```bash
node launcher/main.js
```

Bundle:

```bash
npx esbuild ..\..\launcher\main.js --bundle --platform=node --format=esm --outfile=..\..\launcher\launcher.js
```

Build:

```bash
node --build-sea sea-config.json
```

Test:

```powershell
.\dist\react-press.exe
```

## Launcher Responsibilities

| File              | Responsibility                                        |
| ----------------- | ----------------------------------------------------- |
| `main.js`         | Launcher source entry point and startup orchestration |
| `launcher.js`     | Generated esbuild bundle                              |
| `browser.mjs`     | Browser launching                                     |
| `constants.mjs`   | Shared constants                                      |
| `logger.mjs`      | Logging                                               |
| `setup.mjs`       | Environment setup                                     |
| `state.mjs`       | Runtime state                                         |
| `utils.mjs`       | Shared utilities                                      |
| `viteManager.mjs` | Vite detection, startup, and monitoring               |

## Future Architecture

The launcher is the foundation for React Press local environment management.

Future management layers can include:

```text
Node Version Manager
        ↓
React Version Manager
        ↓
Environment Manager
        ↓
Theme Manager
        ↓
Plugin Manager
        ↓
Project Manager
```

The long-term goal is for React Press to manage Node.js, npm, React versions, environments,
projects, themes, and plugins automatically while keeping the user experience simple.

## References

- Node.js SEA: https://nodejs.org/api/single-executable-applications.html
- Node.js Modules: https://nodejs.org/api/modules.html
- Vite: https://vite.dev/guide/
- esbuild: https://esbuild.github.io/
- npm: https://docs.npmjs.com/
