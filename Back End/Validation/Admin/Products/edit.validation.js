const { body } = require("express-validator")
const mongoose = require("mongoose")
const Category = require("../../../Models/Category.model")

const updateProductValidation = () => {
    const langFields = ["ar", "en"]
    const validators = []

    langFields.forEach((lang) => {
        validators.push(
            body(`langs.${lang}.name`)
                .optional()
                .isString()
                .withMessage(`اسم المنتج (${lang}) يجب أن يكون نصاً`)
                .isLength({ min: 2, max: 100 })
                .withMessage(`اسم المنتج (${lang}) يجب أن يكون بين 2 و 100 حرف`)
                .trim()
                .customSanitizer((value) => value.replace(/\s+/g, " "))
        )

        validators.push(
            body(`langs.${lang}.description`)
                .optional()
                .isString()
                .withMessage(`الوصف المختصر (${lang}) يجب أن يكون نصاً`)
                .trim()
                .custom((value) => {
                    const words = value.trim().split(/\s+/).filter(Boolean)
                    if (words.length > 20) {
                        throw new Error(`الوصف المختصر (${lang}) يجب ألا يزيد عن 20 كلمة`)
                    }
                    return true
                })
        )

        validators.push(
            body(`langs.${lang}.details`)
                .optional()
                .isString()
                .withMessage(`تفاصيل المنتج (${lang}) يجب أن تكون نصاً`)
                .isLength({ min: 10 })
                .withMessage(`تفاصيل المنتج (${lang}) يجب أن تكون 10 أحرف على الأقل`)
                .trim()
        )

        validators.push(
            body(`langs.${lang}.seoTitle`)
                .optional()
                .isString()
                .withMessage(`عنوان SEO (${lang}) يجب أن يكون نصاً`)
                .isLength({ min: 3, max: 60 })
                .withMessage(`عنوان SEO (${lang}) يجب أن يكون بين 3 و 60 حرفاً`)
                .trim()
                .matches(/^[a-zA-Z0-9\s\-]+$/)
                .withMessage(
                    `عنوان SEO (${lang}) يجب أن يحتوي على حروف، أرقام، مسافات، وشرطة (-) فقط`
                )
        )

        validators.push(
            body(`langs.${lang}.seoDescription`)
                .optional()
                .isString()
                .withMessage(`وصف SEO (${lang}) يجب أن يكون نصاً`)
                .isLength({ min: 10, max: 165 })
                .withMessage(`وصف SEO (${lang}) يجب أن يكون بين 10 و 165 حرفاً`)
                .trim()
        )

        validators.push(
            body(`langs.${lang}.seoKeywords`)
                .optional()
                .isArray()
                .withMessage(`الكلمات المفتاحية (${lang}) يجب أن تكون مصفوفة`)
                .custom((value) => {
                    if (!Array.isArray(value)) return true
                    for (let item of value) {
                        if (typeof item !== "string" || item.trim().length === 0) {
                            throw new Error(`كل كلمة مفتاحية (${lang}) يجب أن تكون نصاً غير فارغ`)
                        }
                    }
                    return true
                })
        )
    })

    validators.push(
        body("image")
            .optional()
            .isString()
            .withMessage("صيغة الصورة غير صحيحة")
            .matches(/^data:image\/[\w+.-]+;base64,/)
            .withMessage("صيغة الصورة يجب أن تكون Base64 صحيحة")
    )

    validators.push(
        body("peopleCount")
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage("عدد الأشخاص يجب أن يكون عدداً صحيحاً بين 1 و 1000")
            .toInt()
    )

    validators.push(
        body("categoryId")
            .optional()
            .isMongoId()
            .withMessage("معرف القسم غير صحيح")
            .custom(async (value) => {
                if (!mongoose.Types.ObjectId.isValid(value)) {
                    throw new Error("معرف القسم غير صحيح")
                }
                const category = await Category.findById(value)
                if (!category) {
                    throw new Error("القسم غير موجود")
                }
                return true
            })
    )

    validators.push(
        body("status")
            .optional()
            .isIn(["1", "0"])
            .withMessage("الحالة يجب أن تكون 1 (نشط) أو 0 (غير نشط)")
    )

    return validators
}

module.exports = updateProductValidation
