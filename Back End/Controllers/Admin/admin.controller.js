// let not_found = require("../Data/not_found")
const { validationResult } = require("express-validator")
const Admin = require("../../Models/Admin.model")
const success = require("../../Res/success")
const noData = require("../../Res/no_data")
const catchErrors = require("../../Middleware/utils/CatchErrors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
// Admin Authentication
const register = catchErrors(
    "Failed to Add Admin",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json(errors.array())
    const { name, email, password, role } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const admin = new Admin({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        created_at: new Date()
    })
    createToken(admin)
    const adminObj = admin.toObject()
    delete adminObj.password
    delete adminObj.__v
    res.status(201).json(adminObj)
})
const login = catchErrors(
    "Failed to login",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json(errors.array())
    const { email, password } = req.body
    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" })
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid password" })
    try {
        jwt.verify(admin.token, process.env.JWT_SECRET_KEY)
    } catch {
        admin.token = createToken(admin)
    }
    const adminObj = admin.toObject()
    delete adminObj.password
    delete adminObj.__v
    return res.json(success(adminObj, "Login successful"))
})

// Admin Management

const getAllAdmins = catchErrors(
    "Failed to fetch admins",
    500
)(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit
    const admins = await Admin.find().select("-password -__v").limit(limit).skip(skip)
    admins.length > 0 ? res.json(success(admins)) : res.json(noData())
})

const getOneAdmin = catchErrors(
    "Invalid Object ID",
    500
)(async (req, res) => {
    const admin_id = req.params.id
    const admin = await Admin.findById(admin_id)
    const adminObj = admin.toObject()
    delete adminObj.password
    delete adminObj.__v
    delete adminObj.token
    admin ? res.json(adminObj) : res.status(404).json(not_found)
})
const createToken = (admin) => {
    admin.token = jwt.sign(
        { email: admin.email, id: admin._id, role: admin.role },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "7d" }
    )
    admin.save()
    return admin.token
}
module.exports = {
    getAllAdmins,
    getOneAdmin,
    register,
    login
}
