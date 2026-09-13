const validationWithLang = (errors, res) => {
    const msgs = errors.array().map((err) => err.msg)
    let finalErrors = []
    for (const msg of msgs) {
        try {
            const parsed = JSON.parse(msg)
            if (Array.isArray(parsed)) {
                finalErrors.push(...parsed)
            } else {
                finalErrors.push(parsed)
            }
        } catch (e) {
            finalErrors.push({
                lang_code: "unknown",
                field: "unknown",
                message: msg
            })
        }
    }
    return res.status(400).json({
        success: false,
        errors: finalErrors
    })
}
module.exports = validationWithLang
