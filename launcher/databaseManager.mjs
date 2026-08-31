import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { mongodbInstaller, mongoshInstaller, root } from "./constants.mjs"
import { log, success, warn, error } from "./logger.mjs"

function getMongoDBServiceStatus() {
    try {
        const output = execFileSync("sc.exe", ["query", "MongoDB"], {
            encoding: "utf8",
            windowsHide: true
        })
        const stateMatch = output.match(/STATE\s*:\s*\d+\s+(\w+)/i)
        const running = stateMatch?.[1]?.toUpperCase() === "RUNNING"
        log(`[mongo] MongoDB service is ${running ? "running" : "installed but stopped"}`)
        return {
            exists: true,
            running
        }
    } catch {
        log("[mongo] MongoDB service not found")
        return {
            exists: false,
            running: false
        }
    }
}

function startMongoDBService() {
    log("[mongo] Starting MongoDB service")
    const result = spawnSync(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", 'Start-Service -Name "MongoDB"'],
        {
            encoding: "utf8",
            windowsHide: true
        }
    )

    if (result.status !== 0) {
        error("[mongo] Failed to start MongoDB service")

        if (result.stderr?.trim()) {
            error(`[mongo] ${result.stderr.trim()}`)
        }

        return false
    }

    success("[mongo] MongoDB service started successfully")
    return true
}

function getDriveFreeSpace(drive) {
    const driveLetter = drive.replace(/[:\\]+$/, "")

    const result = spawnSync(
        "powershell.exe",
        ["-NoProfile", "-Command", `(Get-PSDrive -Name '${driveLetter}').Free`],
        {
            encoding: "utf8",
            windowsHide: true
        }
    )

    const value = Number(result.stdout?.trim())

    if (result.status !== 0 || Number.isNaN(value)) {
        error(`[disk] Failed to read free space for ${drive}`)

        if (result.stderr?.trim()) {
            error(`[disk] ${result.stderr.trim()}`)
        }

        return 0
    }

    return value
}

function formatBytes(bytes) {
    if (bytes < 1024 * 1024) {
        return `${bytes} B`
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`
    }

    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function getFriendlyDiskMessage(name, requiredLabel, drive) {
    return `Not enough disk space on ${drive} to install ${name} — free up at least ${requiredLabel} GB on that drive and try again`
}

function getRootDrive() {
    return path.parse(root).root
}

function getSystemDrive() {
    return (process.env.SystemDrive || "C:") + "\\"
}

function checkSingleDrive(drive, name, requiredBytes, requiredLabel) {
    const freeBytes = getDriveFreeSpace(drive)

    log(
        `[disk] ${drive}: ${formatBytes(freeBytes)} free (need ${formatBytes(requiredBytes)} for ${name})`
    )

    if (freeBytes < requiredBytes) {
        error(getFriendlyDiskMessage(name, requiredLabel, drive))
        return false
    }

    return true
}

function checkDiskSpace(name, requiredBytes, requiredLabel) {
    const rootDrive = getRootDrive()

    if (!checkSingleDrive(rootDrive, name, requiredBytes, requiredLabel)) {
        return false
    }

    const systemDrive = getSystemDrive()

    if (systemDrive.toUpperCase() !== rootDrive.toUpperCase()) {
        if (!checkSingleDrive(systemDrive, name, requiredBytes, requiredLabel)) {
            return false
        }
    }

    return true
}

function readMsiLogLines(logPath) {
    if (!logPath || !fs.existsSync(logPath)) {
        return null
    }

    const raw = fs.readFileSync(logPath, "utf16le")

    return raw.split(/\r?\n/).filter(Boolean)
}

function dumpMsiLog(logPath, label) {
    try {
        const lines = readMsiLogLines(logPath)

        if (!lines) {
            error(`[msi] ${label}: no log file found at ${logPath}`)
            return
        }

        const tail = lines.slice(-40)

        log(`[msi] ${label}: last ${tail.length} of ${lines.length} log lines --------------------`)

        for (const line of tail) {
            log(`[msi] ${line}`)
        }

        log(`[msi] ${label}: end of log tail --------------------`)
    } catch (err) {
        error(`[msi] Failed to read ${label} MSI log`)
        error(err.message)
    }
}

function analyzeMsiLog(logPath, name, requiredLabel) {
    const lines = readMsiLogLines(logPath)

    if (!lines) {
        return { handled: false }
    }

    const raw = lines.join("\n")

    if (/OutOfDiskSpace = 1|not enough space|insufficient disk space/i.test(raw)) {
        error(getFriendlyDiskMessage(name, requiredLabel, "the target drive"))
        return { handled: true }
    }

    if (/access is denied|access denied|permission denied/i.test(raw)) {
        error(`[msi] ${name} installation failed due to Windows permissions`)
        return { handled: true }
    }

    if (/another installation is already in progress/i.test(raw)) {
        error(`[msi] ${name} cannot be installed because another installation is already running`)
        return { handled: true }
    }

    if (/reboot required|restart required/i.test(raw)) {
        warn(`[msi] ${name} requires a Windows restart before it can continue`)
        return { handled: true }
    }

    return { handled: false }
}

function installMsi(installer, name, argumentsList, requiredLabel) {
    if (!fs.existsSync(installer)) {
        error(`[msi] ${name} installer was not found`)
        error(`[msi] Expected installer: ${installer}`)
        return { success: false, logPath: null }
    }

    const msiLogPath = path.join(
        os.tmpdir(),
        `react-press-${name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.log`
    )

    const fullArgumentsList = `${argumentsList} /l*v "${msiLogPath}"`

    log(`[msi] Installing ${name}`)
    log(`[msi] ${name} MSI log will be written to: ${msiLogPath}`)

    const command = `Start-Process -FilePath "msiexec.exe" -ArgumentList '${fullArgumentsList}' -Verb RunAs -Wait -PassThru | Select-Object -ExpandProperty ExitCode`

    const result = spawnSync(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
        {
            encoding: "utf8",
            windowsHide: true
        }
    )

    const exitCode = Number(result.stdout?.trim())

    log(`[msi] ${name} installer exit code: ${Number.isNaN(exitCode) ? "unknown" : exitCode}`)

    if (result.error) {
        error(`[msi] ${name} installer process failed to launch`)
        error(`[msi] ${result.error.message}`)
        dumpMsiLog(msiLogPath, name)
        return { success: false, logPath: msiLogPath }
    }

    if (Number.isNaN(exitCode)) {
        error(`[msi] ${name} installer did not return a valid exit code`)
        dumpMsiLog(msiLogPath, name)
        return { success: false, logPath: msiLogPath }
    }

    if (exitCode !== 0) {
        const { handled } = analyzeMsiLog(msiLogPath, name, requiredLabel)

        if (!handled) {
            if (exitCode === 1602) {
                error(`[msi] ${name} installation was cancelled`)
            } else if (exitCode === 1618) {
                error(
                    `[msi] ${name} installation failed: another installation is already in progress`
                )
            } else if (exitCode === 3010) {
                warn(`[msi] ${name} installation completed but Windows requires a restart`)
                return { success: true, logPath: msiLogPath }
            } else {
                error(
                    `[msi] ${name} installation failed with Windows Installer error code ${exitCode}`
                )
            }

            dumpMsiLog(msiLogPath, name)
        }

        return { success: false, logPath: msiLogPath }
    }

    success(`[msi] ${name} installer returned success (exit code 0)`)

    return { success: true, logPath: msiLogPath }
}

function installMongoDB() {
    log("[mongo] Installing MongoDB Community Server")

    const requiredSpace = 5 * 1024 * 1024 * 1024
    const requiredLabel = "5"

    if (!checkDiskSpace("MongoDB Community Server", requiredSpace, requiredLabel)) {
        return { success: false, logPath: null }
    }

    const argumentsList = [
        `/i "${mongodbInstaller}"`,
        "/qn",
        "/norestart",
        `ADDLOCAL="ServerService"`,
        `SHOULD_INSTALL_COMPASS="0"`,
        `SERVICENAME="MongoDB"`,
        `SERVICEDISPLAYNAME="MongoDB"`
    ].join(" ")

    return installMsi(mongodbInstaller, "MongoDB Community Server", argumentsList, requiredLabel)
}

function findMongoshExecutable() {
    try {
        const output = execFileSync("where.exe", ["mongosh.exe"], {
            encoding: "utf8",
            windowsHide: true
        })

        const paths = output
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean)

        for (const executablePath of paths) {
            if (fs.existsSync(executablePath)) {
                return executablePath
            }
        }
    } catch {}

    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local")
    const programFiles = process.env.ProgramFiles || "C:\\Program Files"
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)"

    const locations = [
        path.join(localAppData, "Programs", "mongosh", "mongosh.exe"),
        path.join(localAppData, "Programs", "mongosh", "bin", "mongosh.exe"),
        path.join(programFiles, "mongosh", "bin", "mongosh.exe"),
        path.join(programFiles, "MongoDB", "mongosh", "bin", "mongosh.exe"),
        path.join(programFilesX86, "mongosh", "bin", "mongosh.exe"),
        path.join(programFilesX86, "MongoDB", "mongosh", "bin", "mongosh.exe")
    ]

    for (const executablePath of locations) {
        if (fs.existsSync(executablePath)) {
            return executablePath
        }
    }

    return null
}

function isMongoshInstalled() {
    const executablePath = findMongoshExecutable()

    if (executablePath) {
        log(`[mongosh] mongosh.exe found: ${executablePath}`)
        return true
    }

    log("[mongosh] mongosh.exe not found")
    return false
}

function addMongoshToCurrentPath() {
    const executablePath = findMongoshExecutable()

    if (!executablePath) {
        error("[mongosh] Cannot add mongosh to PATH because mongosh.exe was not found")
        return false
    }

    const binDirectory = path.dirname(executablePath)
    const currentPath = process.env.PATH || ""

    const entries = currentPath
        .split(";")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)

    if (!entries.includes(binDirectory.toLowerCase())) {
        process.env.PATH = `${binDirectory};${currentPath}`
        log(`[mongosh] Added to current process PATH: ${binDirectory}`)
    }

    return true
}

function installMongosh() {
    log("[mongosh] Checking mongosh")

    if (isMongoshInstalled()) {
        addMongoshToCurrentPath()
        success("[mongosh] mongosh is ready")
        return true
    }

    log("[mongosh] Installing mongosh")

    const requiredSpace = 200 * 1024 * 1024
    const requiredLabel = "0.2"

    if (!checkDiskSpace("mongosh", requiredSpace, requiredLabel)) {
        return false
    }

    const argumentsList = `/i "${mongoshInstaller}" /qn /norestart`

    const result = installMsi(mongoshInstaller, "mongosh", argumentsList, requiredLabel)

    if (!result.success) {
        error("[mongosh] mongosh MSI installation failed")
        return false
    }

    log("[mongosh] MSI installation completed, verifying executable")

    const executablePath = findMongoshExecutable()

    if (!executablePath) {
        error("[mongosh] MSI returned success but mongosh.exe was not found")
        dumpMsiLog(result.logPath, "mongosh (post-install verification failure)")
        return false
    }

    log(`[mongosh] mongosh.exe verified: ${executablePath}`)

    if (!addMongoshToCurrentPath()) {
        error("[mongosh] mongosh.exe was found but could not be added to PATH")
        return false
    }

    success("[mongosh] mongosh is ready")
    return true
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
    )

    return result.stdout?.trim().toLowerCase() === "true"
}

function waitForMongoDB(timeout = 15000) {
    const start = Date.now()

    while (Date.now() - start < timeout) {
        const status = getMongoDBServiceStatus()

        if (status.running || checkMongoPortOpen()) {
            success("[mongo] MongoDB is ready")
            return true
        }

        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300)
    }

    error("[mongo] MongoDB did not become ready within the expected time")

    return false
}

async function waitForServiceCreation(timeout = 5000) {
    const start = Date.now()

    while (Date.now() - start < timeout) {
        const status = getMongoDBServiceStatus()

        if (status.exists) {
            return status
        }

        await new Promise((resolve) => setTimeout(resolve, 300))
    }

    return getMongoDBServiceStatus()
}

async function ensureMongoDB() {
    log("[mongo] Checking MongoDB")

    let service = getMongoDBServiceStatus()

    if (!service.exists) {
        const installResult = installMongoDB()

        if (!installResult.success) {
            return {
                success: false,
                reason: "mongodb-install-failed"
            }
        }

        success("[mongo] MongoDB MSI completed successfully")
        log("[mongo] Verifying MongoDB Windows service")

        service = await waitForServiceCreation()

        if (!service.exists) {
            const { handled } = analyzeMsiLog(
                installResult.logPath,
                "MongoDB Community Server",
                "5"
            )

            if (!handled) {
                error(
                    "[mongo] MongoDB MSI reported success, but the MongoDB Windows service was not created"
                )
                dumpMsiLog(
                    installResult.logPath,
                    "MongoDB Community Server (service verification failure)"
                )
            }

            return {
                success: false,
                reason: "mongodb-service-missing"
            }
        }

        success("[mongo] MongoDB Windows service created successfully")
    } else {
        log("[mongo] MongoDB service already exists")
    }

    if (!service.running) {
        if (!startMongoDBService()) {
            return {
                success: false,
                reason: "mongodb-start-failed"
            }
        }
    } else {
        log("[mongo] MongoDB service already running")
    }

    if (!waitForMongoDB()) {
        return {
            success: false,
            reason: "mongodb-not-ready"
        }
    }

    if (!installMongosh()) {
        return {
            success: false,
            reason: "mongosh-install-failed"
        }
    }

    success("[mongo] MongoDB environment is ready")

    return {
        success: true
    }
}

export { ensureMongoDB }
