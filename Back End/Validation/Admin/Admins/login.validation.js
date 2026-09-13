const { body } = require("express-validator")

const loginValidation = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("invalid email format")
            .normalizeEmail(),

        body("password")
            .notEmpty()
            .withMessage("password is required")
            .isLength({ min: 6 })
            .withMessage("password must be at least 6 characters")
    ]
}

module.exports = loginValidation
