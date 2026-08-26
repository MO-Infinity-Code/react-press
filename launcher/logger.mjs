const logPrefix = () => `[${new Date().toISOString()}] MAIN`

function log(...args) {
    console.log(logPrefix(), ...args)
}

function error(...args) {
    console.error(logPrefix(), ...args)
}

export { log, error }
