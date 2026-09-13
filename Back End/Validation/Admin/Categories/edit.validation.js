const { body } = require("express-validator")
const Category = require("../../../Models/Category.model")

const updateCategoryValidation = () => [
    body("langs.ar.name")
        .notEmpty()
        .withMessage("الاسم العربي مطلوب")
        .isString()
        .withMessage("الاسم العربي يجب أن يكون نصًا")
        .isLength({ min: 2 })
        .withMessage("الاسم العربي يجب أن يكون حرفين على الأقل")
        .custom(async (value, { req }) => {
            const exists = await Category.findOne({
                "langs.ar.name": value.trim(),
                _id: { $ne: req.params.id }
            })
            if (exists) {
                throw new Error("الاسم العربي موجود بالفعل")
            }
            return true
        }),

    body("langs.en.name")
        .notEmpty()
        .withMessage("الاسم الإنجليزي مطلوب")
        .isString()
        .withMessage("الاسم الإنجليزي يجب أن يكون نصًا")
        .isLength({ min: 2 })
        .withMessage("الاسم الإنجليزي يجب أن يكون حرفين على الأقل")
        .custom(async (value, { req }) => {
            const exists = await Category.findOne({
                "langs.en.name": value.trim(),
                _id: { $ne: req.params.id }
            })
            if (exists) {
                throw new Error("الاسم الإنجليزي موجود بالفعل")
            }
            return true
        }),

    body("langs.ar.seoTitle")
        .notEmpty()
        .withMessage("عنوان SEO العربي مطلوب")
        .isString()
        .withMessage("عنوان SEO يجب أن يكون نصاً")
        .matches(/^[a-zA-Z0-9\u0600-\u06FF\s\-]+$/)
        .withMessage("عنوان SEO يجب أن يحتوي فقط على حروف، أرقام، مسافات، وشرطة (-)"),

    body("langs.en.seoTitle")
        .notEmpty()
        .withMessage("عنوان SEO الإنجليزي مطلوب")
        .isString()
        .withMessage("عنوان SEO يجب أن يكون نصاً")
        .matches(/^[a-zA-Z0-9\s\-]+$/)
        .withMessage("SEO Title must contain only letters, numbers, spaces, and hyphen (-)"),

    body("langs.ar.seoDescription").notEmpty().withMessage("وصف SEO العربي مطلوب"),

    body("langs.en.seoDescription").notEmpty().withMessage("وصف SEO الإنجليزي مطلوب"),

    body("langs.ar.seoKeywords")
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

    body("langs.en.seoKeywords")
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
        }),

    body("image")
        .optional()
        .isString()
        .withMessage("صيغة الصورة غير صحيحة")
        .matches(/^data:image\/[\w+.-]+;base64,/)
        .withMessage("صيغة الصورة يجب أن تكون Base64 صحيحة")
]

module.exports = updateCategoryValidation
