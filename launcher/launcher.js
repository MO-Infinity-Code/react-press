// launcher/main.js
import path2 from "node:path";
import fs from "node:fs";

// launcher/logger.mjs
var logPrefix = () => `[${(/* @__PURE__ */ new Date()).toISOString()}] MAIN`;
function log(...args) {
  console.log(logPrefix(), ...args);
}
function error(...args) {
  console.error(logPrefix(), ...args);
}

// launcher/constants.mjs
import { fileURLToPath } from "node:url";
import path from "node:path";
var port = 3e3;
var url = `http://localhost:${port}/`;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isSea = process.execPath.toLowerCase().endsWith(".exe");
var root = isSea ? path.resolve(path.dirname(process.execPath), "..") : path.resolve(__dirname, "..");
var projectPath = path.join(root, "projects", "react-press");
var setupScript = path.join(root, "scripts", "setup-environment.mjs");

// launcher/utils.mjs
import http from "node:http";
function waitBeforeExit(code = 1) {
  if (isSea) {
    console.log("");
    console.log("Press Enter to exit...");
    process.stdin.resume();
    process.stdin.once("data", () => {
      process.exit(code);
    });
    return;
  }
  process.exit(code);
}
function checkPort(port2, callback) {
  let finished = false;
  const finish = (result) => {
    if (finished) {
      return;
    }
    finished = true;
    callback(result);
  };
  const request = http.get(
    {
      hostname: "localhost",
      port: port2,
      path: "/"
    },
    (response) => {
      response.resume();
      finish(response.statusCode >= 200 && response.statusCode < 500);
    }
  );
  request.on("error", () => {
    finish(false);
  });
  request.setTimeout(1e3, () => {
    request.destroy();
    finish(false);
  });
}

// launcher/setup.mjs
import { spawn as spawn3, execFileSync } from "node:child_process";

// launcher/viteManager.mjs
import { spawn as spawn2 } from "node:child_process";

// launcher/state.mjs
var state = {
  browserOpened: false,
  viteProcess: null
};

// launcher/browser.mjs
import { spawn } from "node:child_process";
function openBrowser() {
  if (state.browserOpened) {
    return;
  }
  state.browserOpened = true;
  log("Opening:", url);
  const browser = spawn("cmd.exe", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  browser.on("error", (err) => {
    error("Failed to open browser");
    error(err);
    state.browserOpened = false;
  });
  browser.unref();
}

// launcher/viteManager.mjs
function checkExistingVite() {
  log("Checking Vite...");
  checkPort(port, (exists) => {
    if (exists) {
      log("Vite is already running");
      openBrowser();
      return;
    }
    log("Vite is not running");
    startVite();
  });
}
function startVite() {
  log("Starting Vite");
  state.viteProcess = spawn2("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
    cwd: projectPath,
    stdio: "inherit",
    windowsHide: false
  });
  state.viteProcess.on("error", (err) => {
    error("Failed to start Vite");
    error(err);
    waitBeforeExit();
  });
  state.viteProcess.on("close", (code) => {
    error("Vite exited with code:", code);
    if (code !== 0) {
      waitBeforeExit(code);
    }
  });
  waitForVite();
}
function waitForVite() {
  let attempts = 0;
  const maxAttempts = 100;
  const interval = setInterval(() => {
    attempts++;
    checkPort(port, (exists) => {
      if (exists) {
        clearInterval(interval);
        log("Vite is ready");
        openBrowser();
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        error("Vite did not become ready");
        waitBeforeExit();
      }
    });
  }, 300);
}

// launcher/setup.mjs
function runSetup() {
  let nodeCommand = process.execPath;
  if (isSea) {
    try {
      nodeCommand = execFileSync("where.exe", ["node.exe"], {
        encoding: "utf8"
      }).split(/\r?\n/)[0].trim();
    } catch {
      error("Node.js was not found in PATH");
      waitBeforeExit();
    }
  }
  log("Node command:", nodeCommand);
  const setupProcess = spawn3(nodeCommand, [setupScript], {
    cwd: root,
    stdio: "inherit",
    windowsHide: false
  });
  setupProcess.on("error", (err) => {
    error("Failed to start setup script");
    error(err);
    waitBeforeExit();
  });
  setupProcess.on("close", (code) => {
    log("Setup finished with code:", code);
    if (code !== 0) {
      error("Environment setup failed");
      waitBeforeExit(code);
    }
    checkExistingVite();
  });
}

// launcher/main.js
log("========== React Press Launcher ==========");
log("SEA:", isSea);
log("Executable:", process.execPath);
log("Directory:", isSea ? path2.dirname(process.execPath) : __dirname);
log("Root:", root);
log("Project:", projectPath);
log("Setup:", setupScript);
log("URL:", url);
if (!fs.existsSync(projectPath)) {
  error("Project directory does not exist");
  error(projectPath);
  waitBeforeExit();
}
if (!fs.existsSync(setupScript)) {
  error("Setup script does not exist");
  error(setupScript);
  waitBeforeExit();
}
runSetup();
