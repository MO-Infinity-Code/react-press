const logPrefix = () => `[${new Date().toISOString()}] MAIN`

export function log(...args) {
    console.log(logPrefix(), ...args)
}

export function error(...args) {
    console.error(logPrefix(), ...args)
}
