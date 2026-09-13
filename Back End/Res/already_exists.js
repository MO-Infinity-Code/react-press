module.exports = (res, name) => {
    return res.status(400).json({
        success: false,
        message: `${name} already exists`
    })
}
