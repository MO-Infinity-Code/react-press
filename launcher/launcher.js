var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../launcher/logger.mjs
function log(...args) {
  console.log(logPrefix(), ...args);
}
function error(...args) {
  console.error(logPrefix(), ...args);
}
var logPrefix;
var init_logger = __esm({
  "../../launcher/logger.mjs"() {
    logPrefix = () => `[${(/* @__PURE__ */ new Date()).toISOString()}] MAIN`;
  }
});

// ../../launcher/constants.mjs
import { fileURLToPath } from "node:url";
import path from "node:path";
var port, url, requiredNodeVersion, minimumSystemNodeMajor, __filename, __dirname, isSea, root, projectPath, setupScript, nodeErrorPage;
var init_constants = __esm({
  "../../launcher/constants.mjs"() {
    port = 3e3;
    url = `http://localhost:${port}/`;
    requiredNodeVersion = "26.4.0";
    minimumSystemNodeMajor = 26;
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    isSea = process.execPath.toLowerCase().endsWith(".exe");
    root = isSea ? path.resolve(path.dirname(process.execPath), "..") : path.resolve(__dirname, "..");
    projectPath = path.join(root, "projects", "react-press");
    setupScript = path.join(root, "scripts", "setup-environment.mjs");
    nodeErrorPage = path.join(root, "launcher", "node-error.html");
  }
});

// ../../launcher/state.mjs
var state;
var init_state = __esm({
  "../../launcher/state.mjs"() {
    state = {
      browserOpened: false,
      viteProcess: null
    };
  }
});

// ../../launcher/browser.mjs
var browser_exports = {};
__export(browser_exports, {
  openBrowser: () => openBrowser,
  openNodeErrorPage: () => openNodeErrorPage
});
import { spawn as spawn2 } from "node:child_process";
function openBrowser() {
  if (state.browserOpened) {
    return;
  }
  state.browserOpened = true;
  log("Opening:", url);
  const browser = spawn2("cmd.exe", ["/c", "start", "", url], {
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
function openNodeErrorPage(detectedVersion) {
  const separator = nodeErrorPage.includes("?") ? "&" : "?";
  const encodedVersion = encodeURIComponent(detectedVersion || "Unknown");
  const page = `file:///${nodeErrorPage.replace(/\\/g, "/")}${separator}detected=${encodedVersion}`;
  log("Opening Node.js error page:", page);
  const browser = spawn2("cmd.exe", ["/c", "start", "", page], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  browser.unref();
}
var init_browser = __esm({
  "../../launcher/browser.mjs"() {
    init_logger();
    init_state();
    init_constants();
  }
});

// ../../launcher/main.js
init_logger();
init_constants();
import path3 from "node:path";
import fs from "node:fs";

// ../../launcher/utils.mjs
init_constants();
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

// ../../launcher/setup.mjs
init_constants();
init_logger();
import { spawn, execFileSync } from "node:child_process";
function commandExists(command) {
  try {
    execFileSync("where.exe", [command], {
      stdio: "ignore"
    });
    return true;
  } catch {
    return false;
  }
}
function getFnmPath() {
  try {
    return execFileSync("where.exe", ["fnm.exe"], {
      encoding: "utf8"
    }).split(/\r?\n/).map((value) => value.trim()).find(Boolean) || null;
  } catch {
    return null;
  }
}
function getFnmVersions(fnmPath) {
  try {
    const output = execFileSync(fnmPath, ["list"], {
      encoding: "utf8"
    });
    const versions = [];
    for (const line of output.split(/\r?\n/)) {
      const matches = line.match(/v(\d+\.\d+\.\d+)/g);
      if (!matches) {
        continue;
      }
      for (const version of matches) {
        versions.push(version.substring(1));
      }
    }
    return [...new Set(versions)];
  } catch {
    return [];
  }
}
function installNodeWithFnm(fnmPath) {
  log(`Installing Node.js ${requiredNodeVersion}...`);
  try {
    execFileSync(fnmPath, ["install", requiredNodeVersion], {
      stdio: "inherit",
      cwd: root
    });
    return true;
  } catch (err) {
    error("Failed to install Node.js with FNM");
    error(err.message);
    return false;
  }
}
function getFnmNodeExecutable(fnmPath, version) {
  try {
    const output = execFileSync(
      fnmPath,
      ["exec", "--using", version, "node", "-p", "process.execPath"],
      {
        encoding: "utf8",
        cwd: root
      }
    );
    return output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).at(-1) || null;
  } catch {
    return null;
  }
}
function getNodeVersion(nodeCommand) {
  try {
    return execFileSync(nodeCommand, ["--version"], {
      encoding: "utf8"
    }).trim().replace(/^v/, "");
  } catch {
    return null;
  }
}
function getMajorVersion(version) {
  if (!version) {
    return null;
  }
  const major = Number(version.split(".")[0]);
  return Number.isFinite(major) ? major : null;
}
function resolveNode() {
  const fnmPath = getFnmPath();
  if (fnmPath) {
    const versions = getFnmVersions(fnmPath);
    let nodeExecutable = getFnmNodeExecutable(fnmPath, requiredNodeVersion);
    if (!nodeExecutable) {
      if (!versions.includes(requiredNodeVersion)) {
        const installed = installNodeWithFnm(fnmPath);
        if (!installed) {
          return {
            unsupported: true,
            version: null,
            source: "fnm"
          };
        }
      }
      nodeExecutable = getFnmNodeExecutable(fnmPath, requiredNodeVersion);
    }
    if (!nodeExecutable) {
      return {
        unsupported: true,
        version: null,
        source: "fnm"
      };
    }
    const version2 = getNodeVersion(nodeExecutable);
    if (version2 !== requiredNodeVersion) {
      return {
        unsupported: true,
        version: version2,
        source: "fnm"
      };
    }
    log(`Node.js ${version2}`);
    return {
      executable: nodeExecutable,
      version: version2,
      fnmPath,
      source: "fnm"
    };
  }
  if (!commandExists("node.exe")) {
    return {
      unsupported: true,
      version: null,
      source: "system"
    };
  }
  const nodeCommand = execFileSync("where.exe", ["node.exe"], {
    encoding: "utf8"
  }).split(/\r?\n/).map((value) => value.trim()).find(Boolean);
  const version = getNodeVersion(nodeCommand);
  const major = getMajorVersion(version);
  if (!major || major < minimumSystemNodeMajor) {
    return {
      unsupported: true,
      version,
      source: "system"
    };
  }
  log(`Node.js ${version}`);
  return {
    executable: nodeCommand,
    version,
    source: "system"
  };
}
function runSetup() {
  const node = resolveNode();
  if (!node || node.unsupported) {
    return Promise.resolve({
      success: false,
      reason: "unsupported-node",
      version: node?.version || null
    });
  }
  return new Promise((resolve) => {
    const setupProcess = spawn(node.executable, [setupScript], {
      cwd: root,
      stdio: "inherit",
      windowsHide: false
    });
    setupProcess.on("error", (err) => {
      error("Failed to start environment setup");
      error(err.message);
      resolve({
        success: false,
        reason: "setup-process-error"
      });
    });
    setupProcess.on("close", (code) => {
      if (code !== 0) {
        error("Environment setup failed");
        resolve({
          success: false,
          reason: "setup-failed",
          code
        });
        return;
      }
      resolve({
        success: true,
        node
      });
    });
  });
}

// ../../launcher/viteManager.mjs
init_constants();
init_logger();
import { spawn as spawn3 } from "node:child_process";
import path2 from "node:path";
init_state();
init_browser();
function checkExistingVite(node) {
  checkPort(port, (exists) => {
    if (exists) {
      log("Vite already running");
      openBrowser();
      return;
    }
    log("Starting Vite...");
    startVite(node);
  });
}
function startVite(node) {
  const nodeDirectory = path2.dirname(node.executable);
  const npmCli = path2.join(nodeDirectory, "node_modules", "npm", "bin", "npm-cli.js");
  state.viteProcess = spawn3(node.executable, [npmCli, "run", "dev"], {
    cwd: projectPath,
    stdio: "inherit",
    windowsHide: false,
    env: {
      ...process.env,
      PATH: `${nodeDirectory};${process.env.PATH || ""}`
    }
  });
  state.viteProcess.on("error", (err) => {
    error("Failed to start Vite");
    error(err.message);
    waitBeforeExit();
  });
  state.viteProcess.on("close", (code) => {
    if (code !== 0) {
      error(`Vite exited with code ${code}`);
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
        log(`Vite ready: http://localhost:${port}/`);
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

// ../../launcher/main.js
function keepAlive() {
  if (!isSea) {
    return;
  }
  process.stdin.resume();
  process.stdin.on("data", () => {
  });
}
function fail(message, details = null) {
  error(message);
  if (details) {
    error(details);
  }
  keepAlive();
}
async function main() {
  log("========== React Press Launcher ==========");
  log("SEA:", isSea);
  log("Executable:", process.execPath);
  log(
    "Directory:",
    isSea ? path3.dirname(process.execPath) : path3.dirname(new URL(import.meta.url).pathname)
  );
  log("Root:", root);
  log("Project:", projectPath);
  log("Setup:", setupScript);
  if (!fs.existsSync(projectPath)) {
    fail("Project directory does not exist", projectPath);
    return;
  }
  if (!fs.existsSync(setupScript)) {
    fail("Setup script does not exist", setupScript);
    return;
  }
  let setupResult;
  try {
    setupResult = await runSetup();
  } catch (err) {
    fail("Environment setup crashed", err);
    return;
  }
  if (!setupResult?.success) {
    if (setupResult?.reason === "unsupported-node") {
      const { openNodeErrorPage: openNodeErrorPage2 } = await Promise.resolve().then(() => (init_browser(), browser_exports));
      openNodeErrorPage2(setupResult.version);
    }
    fail("React Press could not prepare the required environment");
    return;
  }
  try {
    checkExistingVite(setupResult.node);
  } catch (err) {
    fail("Failed to start Vite", err);
  }
}
main().catch((err) => {
  error("Unhandled React Press Launcher error");
  error(err);
  keepAlive();
});
