const { body } = require("express-validator")
const Language = require("../../../Models/Langs.model")

const languageValidation = () => {
    return [
        body("name")
            .notEmpty()
            .withMessage("language name is required")
            .isLength({ min: 2 })
            .withMessage("language name must be at least 2 characters")
            .custom(async (value) => {
                const exists = await Language.findOne({
                    name: value.trim()
                })
                if (exists) throw new Error("language name already exists")
                return true
            }),

        body("code")
            .notEmpty()
            .withMessage("language code is required")
            .isLength({ min: 2, max: 5 })
            .withMessage("language code must be between 2 and 5 characters")
            .custom(async (value) => {
                const exists = await Language.findOne({
                    code: value.toLowerCase()
                })
                if (exists) throw new Error("language code already exists")
                return true
            })
    ]
}

module.exports = languageValidation
