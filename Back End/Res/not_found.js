module.exports = (res, name) => {
    return res.status(404).json({
        success: false,
        message: `${name} not found`
    })
}
