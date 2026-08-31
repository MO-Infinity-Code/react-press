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
  console.log(`${colors.blue}${logPrefix()}${colors.reset}`, ...args);
}
function success(...args) {
  console.log(`${colors.green}${logPrefix()}${colors.reset}`, ...args);
}
function warn(...args) {
  console.log(`${colors.yellow}${logPrefix()}${colors.reset}`, ...args);
}
function error(...args) {
  console.error(`${colors.red}${logPrefix()}${colors.reset}`, ...args);
}
var logPrefix, colors;
var init_logger = __esm({
  "../../launcher/logger.mjs"() {
    logPrefix = () => `[${(/* @__PURE__ */ new Date()).toISOString()}] MAIN`;
    colors = {
      reset: "\x1B[0m",
      blue: "\x1B[36m",
      green: "\x1B[32m",
      yellow: "\x1B[33m",
      red: "\x1B[31m"
    };
  }
});

// ../../launcher/constants.mjs
import { fileURLToPath } from "node:url";
import path from "node:path";
var port, url, requiredNodeVersion, minimumSystemNodeMajor, __filename, __dirname, isSea, root, projectPath, setupScript, nodeErrorPage, mongodbPath, mongodbInstaller, mongoshInstaller;
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
    mongodbPath = path.join(root, "databases", "progs", "mongodb");
    mongodbInstaller = path.join(mongodbPath, "mongodb-windows-x86_64-8.3.8-signed.msi");
    mongoshInstaller = path.join(mongodbPath, "mongosh-2.10.0-x64.msi");
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
  if (state.browserOpened) return;
  state.browserOpened = true;
  success("Opening:", url);
  const browser = spawn2("cmd.exe", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  browser.on("error", (err) => {
    error("Failed to open browser");
    error(err.message);
    state.browserOpened = false;
  });
  browser.unref();
}
function openNodeErrorPage(detectedVersion) {
  const separator = nodeErrorPage.includes("?") ? "&" : "?";
  const encodedVersion = encodeURIComponent(detectedVersion || "Unknown");
  const page = `file:///${nodeErrorPage.replace(/\\/g, "/")}${separator}detected=${encodedVersion}`;
  warn("Opening Node.js error page:", page);
  const browser = spawn2("cmd.exe", ["/c", "start", "", page], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  browser.on("error", (err) => {
    error("Failed to open Node.js error page");
    error(err.message);
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
import fs2 from "node:fs";

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

// ../../launcher/viteManager.mjs
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

// ../../launcher/databaseManager.mjs
init_constants();
init_logger();
import { execFileSync as execFileSync2, spawnSync } from "node:child_process";
import fs from "node:fs";
import path3 from "node:path";
import os from "node:os";
function getMongoDBServiceStatus() {
  try {
    const output = execFileSync2("sc.exe", ["query", "MongoDB"], {
      encoding: "utf8",
      windowsHide: true
    });
    const stateMatch = output.match(/STATE\s*:\s*\d+\s+(\w+)/i);
    const running = stateMatch?.[1]?.toUpperCase() === "RUNNING";
    log(`[mongo] MongoDB service is ${running ? "running" : "installed but stopped"}`);
    return {
      exists: true,
      running
    };
  } catch {
    log("[mongo] MongoDB service not found");
    return {
      exists: false,
      running: false
    };
  }
}
function startMongoDBService() {
  log("[mongo] Starting MongoDB service");
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", 'Start-Service -Name "MongoDB"'],
    {
      encoding: "utf8",
      windowsHide: true
    }
  );
  if (result.status !== 0) {
    error("[mongo] Failed to start MongoDB service");
    if (result.stderr?.trim()) {
      error(`[mongo] ${result.stderr.trim()}`);
    }
    return false;
  }
  success("[mongo] MongoDB service started successfully");
  return true;
}
function getDriveFreeSpace(drive) {
  const driveLetter = drive.replace(/[:\\]+$/, "");
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-Command", `(Get-PSDrive -Name '${driveLetter}').Free`],
    {
      encoding: "utf8",
      windowsHide: true
    }
  );
  const value = Number(result.stdout?.trim());
  if (result.status !== 0 || Number.isNaN(value)) {
    error(`[disk] Failed to read free space for ${drive}`);
    if (result.stderr?.trim()) {
      error(`[disk] ${result.stderr.trim()}`);
    }
    return 0;
  }
  return value;
}
function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
function getFriendlyDiskMessage(name, requiredLabel, drive) {
  return `Not enough disk space on ${drive} to install ${name} \u2014 free up at least ${requiredLabel} GB on that drive and try again`;
}
function getRootDrive() {
  return path3.parse(root).root;
}
function getSystemDrive() {
  return (process.env.SystemDrive || "C:") + "\\";
}
function checkSingleDrive(drive, name, requiredBytes, requiredLabel) {
  const freeBytes = getDriveFreeSpace(drive);
  log(
    `[disk] ${drive}: ${formatBytes(freeBytes)} free (need ${formatBytes(requiredBytes)} for ${name})`
  );
  if (freeBytes < requiredBytes) {
    error(getFriendlyDiskMessage(name, requiredLabel, drive));
    return false;
  }
  return true;
}
function checkDiskSpace(name, requiredBytes, requiredLabel) {
  const rootDrive = getRootDrive();
  if (!checkSingleDrive(rootDrive, name, requiredBytes, requiredLabel)) {
    return false;
  }
  const systemDrive = getSystemDrive();
  if (systemDrive.toUpperCase() !== rootDrive.toUpperCase()) {
    if (!checkSingleDrive(systemDrive, name, requiredBytes, requiredLabel)) {
      return false;
    }
  }
  return true;
}
function readMsiLogLines(logPath) {
  if (!logPath || !fs.existsSync(logPath)) {
    return null;
  }
  const raw = fs.readFileSync(logPath, "utf16le");
  return raw.split(/\r?\n/).filter(Boolean);
}
function dumpMsiLog(logPath, label) {
  try {
    const lines = readMsiLogLines(logPath);
    if (!lines) {
      error(`[msi] ${label}: no log file found at ${logPath}`);
      return;
    }
    const tail = lines.slice(-40);
    log(`[msi] ${label}: last ${tail.length} of ${lines.length} log lines --------------------`);
    for (const line of tail) {
      log(`[msi] ${line}`);
    }
    log(`[msi] ${label}: end of log tail --------------------`);
  } catch (err) {
    error(`[msi] Failed to read ${label} MSI log`);
    error(err.message);
  }
}
function analyzeMsiLog(logPath, name, requiredLabel) {
  const lines = readMsiLogLines(logPath);
  if (!lines) {
    return { handled: false };
  }
  const raw = lines.join("\n");
  if (/OutOfDiskSpace = 1|not enough space|insufficient disk space/i.test(raw)) {
    error(getFriendlyDiskMessage(name, requiredLabel, "the target drive"));
    return { handled: true };
  }
  if (/access is denied|access denied|permission denied/i.test(raw)) {
    error(`[msi] ${name} installation failed due to Windows permissions`);
    return { handled: true };
  }
  if (/another installation is already in progress/i.test(raw)) {
    error(`[msi] ${name} cannot be installed because another installation is already running`);
    return { handled: true };
  }
  if (/reboot required|restart required/i.test(raw)) {
    warn(`[msi] ${name} requires a Windows restart before it can continue`);
    return { handled: true };
  }
  return { handled: false };
}
function installMsi(installer, name, argumentsList, requiredLabel) {
  if (!fs.existsSync(installer)) {
    error(`[msi] ${name} installer was not found`);
    error(`[msi] Expected installer: ${installer}`);
    return { success: false, logPath: null };
  }
  const msiLogPath = path3.join(
    os.tmpdir(),
    `react-press-${name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.log`
  );
  const fullArgumentsList = `${argumentsList} /l*v "${msiLogPath}"`;
  log(`[msi] Installing ${name}`);
  log(`[msi] ${name} MSI log will be written to: ${msiLogPath}`);
  const command = `Start-Process -FilePath "msiexec.exe" -ArgumentList '${fullArgumentsList}' -Verb RunAs -Wait -PassThru | Select-Object -ExpandProperty ExitCode`;
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
    {
      encoding: "utf8",
      windowsHide: true
    }
  );
  const exitCode = Number(result.stdout?.trim());
  log(`[msi] ${name} installer exit code: ${Number.isNaN(exitCode) ? "unknown" : exitCode}`);
  if (result.error) {
    error(`[msi] ${name} installer process failed to launch`);
    error(`[msi] ${result.error.message}`);
    dumpMsiLog(msiLogPath, name);
    return { success: false, logPath: msiLogPath };
  }
  if (Number.isNaN(exitCode)) {
    error(`[msi] ${name} installer did not return a valid exit code`);
    dumpMsiLog(msiLogPath, name);
    return { success: false, logPath: msiLogPath };
  }
  if (exitCode !== 0) {
    const { handled } = analyzeMsiLog(msiLogPath, name, requiredLabel);
    if (!handled) {
      if (exitCode === 1602) {
        error(`[msi] ${name} installation was cancelled`);
      } else if (exitCode === 1618) {
        error(
          `[msi] ${name} installation failed: another installation is already in progress`
        );
      } else if (exitCode === 3010) {
        warn(`[msi] ${name} installation completed but Windows requires a restart`);
        return { success: true, logPath: msiLogPath };
      } else {
        error(
          `[msi] ${name} installation failed with Windows Installer error code ${exitCode}`
        );
      }
      dumpMsiLog(msiLogPath, name);
    }
    return { success: false, logPath: msiLogPath };
  }
  success(`[msi] ${name} installer returned success (exit code 0)`);
  return { success: true, logPath: msiLogPath };
}
function installMongoDB() {
  log("[mongo] Installing MongoDB Community Server");
  const requiredSpace = 5 * 1024 * 1024 * 1024;
  const requiredLabel = "5";
  if (!checkDiskSpace("MongoDB Community Server", requiredSpace, requiredLabel)) {
    return { success: false, logPath: null };
  }
  const argumentsList = [
    `/i "${mongodbInstaller}"`,
    "/qn",
    "/norestart",
    `ADDLOCAL="ServerService"`,
    `SHOULD_INSTALL_COMPASS="0"`,
    `SERVICENAME="MongoDB"`,
    `SERVICEDISPLAYNAME="MongoDB"`
  ].join(" ");
  return installMsi(mongodbInstaller, "MongoDB Community Server", argumentsList, requiredLabel);
}
function findMongoshExecutable() {
  try {
    const output = execFileSync2("where.exe", ["mongosh.exe"], {
      encoding: "utf8",
      windowsHide: true
    });
    const paths = output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    for (const executablePath of paths) {
      if (fs.existsSync(executablePath)) {
        return executablePath;
      }
    }
  } catch {
  }
  const localAppData = process.env.LOCALAPPDATA || path3.join(os.homedir(), "AppData", "Local");
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const locations = [
    path3.join(localAppData, "Programs", "mongosh", "mongosh.exe"),
    path3.join(localAppData, "Programs", "mongosh", "bin", "mongosh.exe"),
    path3.join(programFiles, "mongosh", "bin", "mongosh.exe"),
    path3.join(programFiles, "MongoDB", "mongosh", "bin", "mongosh.exe"),
    path3.join(programFilesX86, "mongosh", "bin", "mongosh.exe"),
    path3.join(programFilesX86, "MongoDB", "mongosh", "bin", "mongosh.exe")
  ];
  for (const executablePath of locations) {
    if (fs.existsSync(executablePath)) {
      return executablePath;
    }
  }
  return null;
}
function isMongoshInstalled() {
  const executablePath = findMongoshExecutable();
  if (executablePath) {
    log(`[mongosh] mongosh.exe found: ${executablePath}`);
    return true;
  }
  log("[mongosh] mongosh.exe not found");
  return false;
}
function addMongoshToCurrentPath() {
  const executablePath = findMongoshExecutable();
  if (!executablePath) {
    error("[mongosh] Cannot add mongosh to PATH because mongosh.exe was not found");
    return false;
  }
  const binDirectory = path3.dirname(executablePath);
  const currentPath = process.env.PATH || "";
  const entries = currentPath.split(";").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  if (!entries.includes(binDirectory.toLowerCase())) {
    process.env.PATH = `${binDirectory};${currentPath}`;
    log(`[mongosh] Added to current process PATH: ${binDirectory}`);
  }
  return true;
}
function installMongosh() {
  log("[mongosh] Checking mongosh");
  if (isMongoshInstalled()) {
    addMongoshToCurrentPath();
    success("[mongosh] mongosh is ready");
    return true;
  }
  log("[mongosh] Installing mongosh");
  const requiredSpace = 200 * 1024 * 1024;
  const requiredLabel = "0.2";
  if (!checkDiskSpace("mongosh", requiredSpace, requiredLabel)) {
    return false;
  }
  const argumentsList = `/i "${mongoshInstaller}" /qn /norestart`;
  const result = installMsi(mongoshInstaller, "mongosh", argumentsList, requiredLabel);
  if (!result.success) {
    error("[mongosh] mongosh MSI installation failed");
    return false;
  }
  log("[mongosh] MSI installation completed, verifying executable");
  const executablePath = findMongoshExecutable();
  if (!executablePath) {
    error("[mongosh] MSI returned success but mongosh.exe was not found");
    dumpMsiLog(result.logPath, "mongosh (post-install verification failure)");
    return false;
  }
  log(`[mongosh] mongosh.exe verified: ${executablePath}`);
  if (!addMongoshToCurrentPath()) {
    error("[mongosh] mongosh.exe was found but could not be added to PATH");
    return false;
  }
  success("[mongosh] mongosh is ready");
  return true;
}
function checkMongoPortOpen() {
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      "Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet"
    ],
    {
      encoding: "utf8",
      windowsHide: true
    }
  );
  return result.stdout?.trim().toLowerCase() === "true";
}
function waitForMongoDB(timeout = 15e3) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const status = getMongoDBServiceStatus();
    if (status.running || checkMongoPortOpen()) {
      success("[mongo] MongoDB is ready");
      return true;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
  }
  error("[mongo] MongoDB did not become ready within the expected time");
  return false;
}
async function waitForServiceCreation(timeout = 5e3) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const status = getMongoDBServiceStatus();
    if (status.exists) {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return getMongoDBServiceStatus();
}
async function ensureMongoDB() {
  log("[mongo] Checking MongoDB");
  let service = getMongoDBServiceStatus();
  if (!service.exists) {
    const installResult = installMongoDB();
    if (!installResult.success) {
      return {
        success: false,
        reason: "mongodb-install-failed"
      };
    }
    success("[mongo] MongoDB MSI completed successfully");
    log("[mongo] Verifying MongoDB Windows service");
    service = await waitForServiceCreation();
    if (!service.exists) {
      const { handled } = analyzeMsiLog(
        installResult.logPath,
        "MongoDB Community Server",
        "5"
      );
      if (!handled) {
        error(
          "[mongo] MongoDB MSI reported success, but the MongoDB Windows service was not created"
        );
        dumpMsiLog(
          installResult.logPath,
          "MongoDB Community Server (service verification failure)"
        );
      }
      return {
        success: false,
        reason: "mongodb-service-missing"
      };
    }
    success("[mongo] MongoDB Windows service created successfully");
  } else {
    log("[mongo] MongoDB service already exists");
  }
  if (!service.running) {
    if (!startMongoDBService()) {
      return {
        success: false,
        reason: "mongodb-start-failed"
      };
    }
  } else {
    log("[mongo] MongoDB service already running");
  }
  if (!waitForMongoDB()) {
    return {
      success: false,
      reason: "mongodb-not-ready"
    };
  }
  if (!installMongosh()) {
    return {
      success: false,
      reason: "mongosh-install-failed"
    };
  }
  success("[mongo] MongoDB environment is ready");
  return {
    success: true
  };
}

// ../../launcher/main.js
function keepAlive() {
  if (!isSea) return;
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
  if (!fs2.existsSync(projectPath)) {
    fail("Project directory does not exist", projectPath);
    return;
  }
  if (!fs2.existsSync(setupScript)) {
    fail("Setup script does not exist", setupScript);
    return;
  }
  let mongoResult;
  try {
    mongoResult = await ensureMongoDB();
  } catch (err) {
    fail("MongoDB setup crashed", err);
    return;
  }
  if (!mongoResult?.success) {
    fail("React Press could not prepare MongoDB", mongoResult?.reason);
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
