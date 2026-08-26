# React Press Launcher — Developer Guide

This guide explains how to develop, test, bundle, and build the React Press Launcher as a standalone
Windows executable.

## Overview

The React Press Launcher is responsible for starting the local React Press development environment.

The launcher performs the following workflow:

```text
ReactPress.exe
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

The launcher is designed to keep the user away from manual Node.js, npm, Vite, and environment
management operations.

## Requirements

The development machine should have:

- Node.js 20.19+ or 22.12+
- npm
- Windows
- Access to the React Press source tree

Verify Node.js:

```bash
node --version
```

Verify npm:

```bash
npm --version
```

No global installation of esbuild is required.

The build process uses:

```bash
npx esbuild
```

## Project Structure

The current launcher structure is:

```text
react-press/
│
├── dist/
│   ├── bundle.js
│   └── react-press.exe
│
├── launcher/
│   ├── launcher.js
│   ├── browser-manager.js
│   ├── config.js
│   ├── logger.js
│   ├── path-manager.js
│   ├── process-utils.js
│   ├── setup-manager.js
│   └── vite-manager.js
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
│       ├── src/
│       ├── public/
│       └── ...
│
├── sea-config.json
└── package.json
```

## Launcher Responsibilities

The launcher acts as the main orchestration layer.

Its responsibilities are:

```text
Environment Setup
        ↓
Vite Detection
        ↓
Vite Startup
        ↓
Vite Readiness Check
        ↓
Browser Launch
```

The actual React project is located under:

```text
projects/react-press/
```

The shared React environment is stored under:

```text
react/19.2.8/
```

## Shared React Environments

Each React version can have its own environment.

Example:

```text
react/
├── 19.2.8/
│   └── node_modules/
│
└── 19.2.9/
    └── node_modules/
```

The environment represents the dependency set associated with a specific React version.

A project using React 19.2.8 should resolve its shared dependencies from:

```text
react/19.2.8/node_modules/
```

The goal is to avoid downloading and storing the same dependency tree for every project.

## Junctions

Windows Junctions are used to expose the shared environment through the project dependency path.

Example:

```text
projects/react-press/node_modules
        ↓
react/19.2.8/node_modules
```

The Junction does not duplicate the dependency files.

It allows tools such as Node.js, Vite, TypeScript, and related tooling to resolve packages from the
expected project-level `node_modules` path.

## Important Dependency Rule

Shared dependencies belong to the React environment.

Project configuration belongs to the project.

For example:

```text
react/19.2.8/
├── package.json
└── node_modules/
```

while:

```text
projects/client-project/
├── package.json
├── src/
└── ...
```

Environment dependency changes should be performed through the environment manager rather than
manually installing packages inside a project.

## Running the Launcher During Development

From the project root:

```bash
node launcher/launcher.js
```

The launcher will:

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

## Building the Launcher Bundle

The launcher source is split across multiple files.

Before creating the executable, these files must be bundled into a single JavaScript file.

Navigate to the React project directory:

```bash
cd react-press\projects\react-press
```

Run:

```bash
npx esbuild ..\..\launcher\launcher.js --bundle --platform=node --format=esm --outfile=..\..\dist\bundle.js
```

This generates:

```text
dist/
└── bundle.js
```

The bundle contains the launcher and its imported modules.

## Building the SEA Executable

After generating `dist/bundle.js`, return to the React Press root:

```bash
cd ..\..
```

Then run:

```bash
node --build-sea sea-config.json
```

The executable is generated according to the SEA configuration.

Expected output:

```text
dist/
├── bundle.js
└── react-press.exe
```

## SEA Configuration

The `sea-config.json` file should point to the bundled launcher:

```json
{
    "main": "dist/bundle.js",
    "mainFormat": "module",
    "output": "dist/react-press.exe",
    "disableExperimentalSEAWarning": true
}
```

## Automated Build

The build can be automated through npm scripts.

Example:

```json
{
    "scripts": {
        "bundle": "esbuild launcher/launcher.js --bundle --platform=node --format=esm --outfile=dist/bundle.js",
        "build": "npm run bundle && node --build-sea sea-config.json"
    }
}
```

Then run:

```bash
npm run build
```

## Testing the Executable

After building:

```text
dist/
└── react-press.exe
```

Run it from PowerShell:

```powershell
.\dist\react-press.exe
```

The expected workflow is:

```text
React Press Launcher
        ↓
Environment Setup
        ↓
Vite Detection
        ↓
Vite Startup
        ↓
localhost:3000
        ↓
Default Browser
```

## Troubleshooting

### Resource Busy or Locked

If the SEA build reports that a resource is busy or locked, close any running `react-press.exe`
process before rebuilding.

Stop any running Vite process if necessary.

### esbuild Errors

Verify that the build command is executed from:

```text
react-press\projects\react-press
```

The relative paths must match the project structure.

Run:

```bash
npx esbuild ..\..\launcher\launcher.js --bundle --platform=node --format=esm --outfile=..\..\dist\bundle.js
```

### Vite Is Not Recognized

Verify that the selected React environment contains Vite and that the project can resolve the shared
`node_modules`.

### Node.js Version Warning

Verify the Node.js version:

```bash
node --version
```

The Node.js version used to run the launcher and Vite must satisfy the requirements of the current
Vite version.

## Launcher Modules

The launcher is intentionally divided into multiple modules.

```text
launcher/
├── launcher.js
├── config.js
├── logger.js
├── path-manager.js
├── process-utils.js
├── setup-manager.js
├── vite-manager.js
└── browser-manager.js
```

Responsibilities:

| File                 | Responsibility             |
| -------------------- | -------------------------- |
| `launcher.js`        | Main orchestration         |
| `config.js`          | Application configuration  |
| `logger.js`          | Logging                    |
| `path-manager.js`    | Path resolution            |
| `process-utils.js`   | Process-related utilities  |
| `setup-manager.js`   | Environment setup          |
| `vite-manager.js`    | Vite detection and startup |
| `browser-manager.js` | Browser launching          |

Keeping these responsibilities separated makes future changes easier and reduces the complexity of
the main launcher.

## Development Workflow

Recommended workflow:

```text
Modify Launcher
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

Commands:

```bash
node launcher/launcher.js
```

Then:

```bash
npm run build
```

Then:

```powershell
.\dist\react-press.exe
```

## Future Architecture

The launcher is the foundation for future React Press environment management.

Planned responsibilities include:

```text
Node Version Management
        ↓
React Version Management
        ↓
Environment Management
        ↓
Theme Management
        ↓
Plugin Management
        ↓
Project Management
```

The long-term goal is for the user to interact only with React Press while Node.js, npm, React
versions, environments, themes, plugins, and projects are managed automatically in the background.

## References

- Node.js SEA: https://nodejs.org/api/single-executable-applications.html
- Node.js Modules: https://nodejs.org/api/modules.html
- Vite: https://vite.dev/guide/
- esbuild: https://esbuild.github.io/
- npm: https://docs.npmjs.com/
