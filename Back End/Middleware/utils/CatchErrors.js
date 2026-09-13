module.exports = (errorMessage, errorStatus) => {
    return (fn) => {
        return (req, res, next) => {
            fn(req, res, next).catch((err) => {
                // console.log(err)
                res.status(errorStatus).json({
                    message: errorMessage,
                    success: false,
                    errorStatus: errorStatus
                })
            })
        }
    }
}
