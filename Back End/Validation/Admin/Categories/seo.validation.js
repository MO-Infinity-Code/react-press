const { body } = require("express-validator")

const categoriesSeoValidation = () => [
    body("langs.ar.seoTitle")
        .notEmpty()
        .withMessage("عنوان SEO العربي مطلوب")
        .isString()
        .withMessage("عنوان SEO العربي يجب أن يكون نصاً")
        .matches(/^[a-zA-Z0-9\u0600-\u06FF\s\-]+$/)
        .withMessage("عنوان SEO العربي يجب أن يحتوي فقط على حروف، أرقام، مسافات، وشرطة (-)"),

    body("langs.en.seoTitle")
        .notEmpty()
        .withMessage("عنوان SEO الإنجليزي مطلوب")
        .isString()
        .withMessage("عنوان SEO الإنجليزي يجب أن يكون نصاً")
        .matches(/^[a-zA-Z0-9\s\-]+$/)
        .withMessage("SEO Title must contain only letters, numbers, spaces, and hyphen (-)"),

    body("langs.ar.seoDescription")
        .notEmpty()
        .withMessage("وصف SEO العربي مطلوب")
        .isString()
        .withMessage("وصف SEO العربي يجب أن يكون نصاً"),

    body("langs.en.seoDescription")
        .notEmpty()
        .withMessage("وصف SEO الإنجليزي مطلوب")
        .isString()
        .withMessage("وصف SEO الإنجليزي يجب أن يكون نصاً"),

    body("langs.ar.seoKeywords")
        .optional()
        .isArray()
        .withMessage("الكلمات المفتاحية العربية يجب أن تكون مصفوفة")
        .custom((value) => {
            for (const item of value) {
                if (typeof item !== "string") {
                    throw new Error("كل كلمة مفتاحية عربية يجب أن تكون نصاً")
                }
            }

            return true
        }),

    body("langs.en.seoKeywords")
        .optional()
        .isArray()
        .withMessage("الكلمات المفتاحية الإنجليزية يجب أن تكون مصفوفة")
        .custom((value) => {
            for (const item of value) {
                if (typeof item !== "string") {
                    throw new Error("كل كلمة مفتاحية إنجليزية يجب أن تكون نصاً")
                }
            }

            return true
        })
]

module.exports = categoriesSeoValidation
