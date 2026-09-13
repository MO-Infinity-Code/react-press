const { body } = require("express-validator")

const websiteSeoValidation = () => [
    body("langs.ar.site_name")
        .notEmpty()
        .withMessage("اسم الموقع العربي مطلوب")
        .isString()
        .withMessage("يجب أن يكون نصاً"),

    body("langs.en.site_name")
        .notEmpty()
        .withMessage("اسم الموقع الإنجليزي مطلوب")
        .isString()
        .withMessage("يجب أن يكون نصاً"),

    body("langs.ar.site_description")
        .notEmpty()
        .withMessage("وصف الموقع العربي مطلوب")
        .isString()
        .withMessage("يجب أن يكون نصاً"),

    body("langs.en.site_description")
        .notEmpty()
        .withMessage("وصف الموقع الإنجليزي مطلوب")
        .isString()
        .withMessage("يجب أن يكون نصاً"),

    body("langs.ar.site_keywords")
        .optional()
        .isArray()
        .withMessage("الكلمات المفتاحية العربية يجب أن تكون مصفوفة")
        .custom((value) => {
            if (!Array.isArray(value)) return true
            for (let item of value) {
                if (typeof item !== "string") {
                    throw new Error("كل كلمة مفتاحية يجب أن تكون نصاً")
                }
            }
            return true
        }),

    body("langs.en.site_keywords")
        .optional()
        .isArray()
        .withMessage("الكلمات المفتاحية الإنجليزية يجب أن تكون مصفوفة")
        .custom((value) => {
            if (!Array.isArray(value)) return true
            for (let item of value) {
                if (typeof item !== "string") {
                    throw new Error("كل كلمة مفتاحية يجب أن تكون نصاً")
                }
            }
            return true
        })
]

module.exports = websiteSeoValidation
