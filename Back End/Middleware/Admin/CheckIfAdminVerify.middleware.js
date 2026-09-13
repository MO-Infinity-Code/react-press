const jwt = require("jsonwebtoken")
const verifyToken = (req, res, next) => {
    const token =
        req.headers["authorization"]?.split(" ")[1] || req.headers["Authorization"]?.split(" ")[1]
    if (!token) return res.status(401).json({ message: "Unauthorized", success: false })
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.admin = decoded
        next()
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized", success: false })
    }
}
module.exports = verifyToken
