const logPrefix = () => `[${new Date().toISOString()}] MAIN`
const colors = {
    reset: "\x1b[0m",
    blue: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m"
}
function log(...args) {
    console.log(`${colors.blue}${logPrefix()}${colors.reset}`, ...args)
}
function success(...args) {
    console.log(`${colors.green}${logPrefix()}${colors.reset}`, ...args)
}
function warn(...args) {
    console.log(`${colors.yellow}${logPrefix()}${colors.reset}`, ...args)
}
function error(...args) {
    console.error(`${colors.red}${logPrefix()}${colors.reset}`, ...args)
}
export { log, success, warn, error }
