const { body } = require("express-validator")
const Admin = require("../../../Models/Admin.model")

const registerValidation = () => {
    return [
        body("name")
            .notEmpty()
            .withMessage("name is required")
            .isLength({ min: 3 })
            .withMessage("name must be at least 3 characters"),

        body("email")
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("invalid email format")
            .normalizeEmail()
            .custom(async (value) => {
                const exists = await Admin.findOne({ email: value })
                if (exists) throw new Error("email already exists")
                return true
            }),

        body("password")
            .notEmpty()
            .withMessage("password is required")
            .isLength({ min: 6 })
            .withMessage("password must be at least 6 characters"),

        body("role")
            .notEmpty()
            .withMessage("role is required")
            .isIn(["Admin", "SuperAdmin", "Manager"])
            .withMessage("role must be Admin, SuperAdmin, or User")
    ]
}

module.exports = registerValidation
