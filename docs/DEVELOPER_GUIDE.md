# React Press Launcher — Developer Guide

This guide explains how to develop, test, bundle, and build the React Press Launcher as a standalone
Windows executable using Node.js SEA.

## Overview

React Press Launcher is responsible for preparing the local React Press environment, starting the
Vite development server when required, and opening the React Press application in the default
browser.

The launcher follows this workflow:

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

The launcher is designed so that the user does not need to manually run npm commands for the normal
React Press startup process.

## Requirements

The development machine should have:

- Windows
- Node.js 20.19+ or 22.12+
- npm
- Git

Verify Node.js:

```bash
node --version
```

Verify npm:

```bash
npm --version
```

The project does not require a global installation of esbuild.

The build process uses:

```bash
npx esbuild
```

## Project Structure

The launcher source is separated from the generated launcher bundle.

```text
react-press/
│
├── launcher/
│   ├── main.js
│   ├── browser-manager.js
│   ├── config.js
│   ├── logger.js
│   ├── path-manager.js
│   ├── process-utils.js
│   ├── setup-manager.js
│   ├── vite-manager.js
│   └── launcher.js
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
├── dist/
│
├── sea-config.json
└── package.json
```

## Launcher Source

The main launcher source file is:

```text
launcher/main.js
```

The generated bundled launcher is:

```text
launcher/launcher.js
```

The source files imported by `main.js` are bundled together by esbuild.

## Shared React Environment

React Press keeps React environments separately.

Example:

```text
react/
├── 19.2.8/
│   └── node_modules/
│
└── 19.2.9/
    └── node_modules/
```

Each environment represents the dependency set associated with a specific React version.

The goal is to avoid downloading and storing the same dependency tree independently for every
project.

## Project Structure

Projects remain independent and keep their own configuration.

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

The project's configuration is kept separate from the shared React environment.

## Junctions

On Windows, React Press can use a Junction to expose the shared environment to a project.

Example:

```text
projects/react-press/node_modules
        ↓
react/19.2.8/node_modules
```

The Junction does not create a second physical copy of the dependency files.

It allows Node.js and development tools such as Vite and TypeScript to resolve packages through the
expected project-level `node_modules` path.

## Environment Setup

The environment setup script is responsible for preparing the project's dependency environment.

Current script:

```text
scripts/setup-environment.js
```

The launcher executes this process before checking or starting Vite.

The setup workflow is:

```text
Launcher
    ↓
setup-environment.js
    ↓
Check shared environment
    ↓
Create Junction if required
```

If the Junction already exists, the setup process leaves it unchanged.

## Running the Launcher During Development

The launcher can be executed directly from the project root:

```bash
node launcher/main.js
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

## Bundling the Launcher

Before creating the standalone executable, the launcher source must be bundled.

The source entry point is:

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

This command performs the following:

```text
launcher/main.js
        ↓
      esbuild
        ↓
launcher/launcher.js
```

The generated `launcher.js` contains the launcher source and its imported modules in a single
bundled file.

Do not use the source file as the output file.

Correct:

```text
Input:
launcher/main.js

Output:
launcher/launcher.js
```

Incorrect:

```text
Input:
launcher/main.js

Output:
launcher/main.js
```

## Building the SEA Executable

After creating:

```text
launcher/launcher.js
```

return to the React Press root:

```bash
cd ..\..
```

Then build the executable:

```bash
node --build-sea sea-config.json
```

The generated executable will be placed according to the `sea-config.json` configuration.

## SEA Configuration

The `sea-config.json` file should use the generated launcher bundle as the main entry point:

```json
{
    "main": "launcher/launcher.js",
    "mainFormat": "module",
    "output": "dist/react-press.exe",
    "disableExperimentalSEAWarning": true
}
```

The build flow is therefore:

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

## Building with npm Scripts

The process can be automated through npm scripts in the root `package.json`.

Example:

```json
{
    "scripts": {
        "bundle": "esbuild launcher/main.js --bundle --platform=node --format=esm --outfile=launcher/launcher.js",
        "build": "npm run bundle && node --build-sea sea-config.json"
    }
}
```

Then the entire build can be performed with:

```bash
npm run build
```

## Testing the Executable

After building:

```text
dist/
└── react-press.exe
```

Run it:

```powershell
.\dist\react-press.exe
```

The expected startup flow is:

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

If Node SEA reports that a resource is busy or locked, make sure no previous `react-press.exe`
process is still running.

Stop any running Vite process before rebuilding when necessary.

### esbuild Cannot Resolve main.js

Make sure the command is executed from:

```text
react-press\projects\react-press
```

Verify the source file exists:

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

### Vite Is Not Recognized

If you receive:

```text
vite is not recognized
```

verify that the React environment contains Vite and that the project can resolve the shared
dependencies.

### Node.js Version Warning

Check the Node.js version:

```bash
node --version
```

The Node.js version used by the launcher and Vite must satisfy the requirements of the installed
Vite version.

## Launcher Modules

The launcher is intentionally divided into multiple modules.

```text
launcher/
├── main.js
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

| File                 | Responsibility              |
| -------------------- | --------------------------- |
| `main.js`            | Launcher source entry point |
| `launcher.js`        | Generated bundled launcher  |
| `config.js`          | Application configuration   |
| `logger.js`          | Logging                     |
| `path-manager.js`    | Path resolution             |
| `process-utils.js`   | Process utilities           |
| `setup-manager.js`   | Environment setup           |
| `vite-manager.js`    | Vite detection and startup  |
| `browser-manager.js` | Browser launching           |

`launcher.js` should be treated as a generated file when it is produced by esbuild.

The source code that should normally be edited is `main.js` and the supporting launcher modules.

## Development Workflow

The recommended development workflow is:

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

Build the executable:

```bash
node --build-sea sea-config.json
```

Test:

```powershell
.\dist\react-press.exe
```

## Future Architecture

The launcher is the foundation for React Press's local environment management system.

Future components may include:

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
