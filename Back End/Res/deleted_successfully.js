module.exports = (res, name) => {
    return res.json({
        success: true,
        message: `${name} deleted successfully`
    })
}
