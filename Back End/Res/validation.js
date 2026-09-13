module.exports = (res, errors) => {
    return res.json({
        success: false,
        errors: errors
    })
}
