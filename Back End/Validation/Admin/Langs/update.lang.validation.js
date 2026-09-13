const { body } = require("express-validator")
const Language = require("../../../Models/Langs.model")

const updateLangValidation = () => {
    return [
        body("name")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Language name is required")
            .custom(async (value, { req }) => {
                const exists = await Language.findOne({
                    name: new RegExp(`^${value}$`, "i"),
                    _id: { $ne: req.params.id }
                })
                if (exists) throw new Error("Language name already exists")
                return true
            }),

        body("code")
            .optional()
            .trim()
            .toLowerCase()
            .notEmpty()
            .withMessage("Language code is required")
            .custom(async (value, { req }) => {
                const exists = await Language.findOne({
                    code: value,
                    _id: { $ne: req.params.id }
                })
                if (exists) throw new Error("Language code already exists")
                return true
            })
    ]
}

module.exports = updateLangValidation
