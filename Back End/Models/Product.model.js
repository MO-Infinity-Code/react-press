const mongoose = require("mongoose")

const productLanguageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: [2, "الاسم يجب أن يكون حرفين على الأقل"],
            maxlength: [100, "الاسم لا يتجاوز 100 حرف"]
        },
        description: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    const words = v.trim().split(/\s+/).filter(Boolean)
                    return words.length <= 20
                },
                message: "الوصف المختصر يجب ألا يزيد عن 20 كلمة"
            }
        },
        details: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "تفاصيل المنتج يجب أن تكون 10 أحرف على الأقل"]
        },
        seoTitle: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, "عنوان SEO يجب أن يكون 3 أحرف على الأقل"],
            maxlength: [60, "عنوان SEO لا يتجاوز 60 حرفاً"],
            match: [
                /^[a-zA-Z0-9\s\-]+$/,
                "عنوان SEO يجب أن يحتوي على حروف، أرقام، مسافات، وشرطة (-) فقط"
            ]
        },
        seoDescription: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "وصف SEO يجب أن يكون 10 أحرف على الأقل"],
            maxlength: [165, "وصف SEO لا يتجاوز 165 حرفاً"]
        },
        seoKeywords: {
            type: [String],
            default: [],
            validate: {
                validator: function (v) {
                    if (!Array.isArray(v)) return false
                    return v.every((item) => typeof item === "string" && item.trim().length > 0)
                },
                message: "يجب أن تكون الكلمات المفتاحية مصفوفة من نصوص غير فارغة"
            }
        }
    },
    {
        _id: false
    }
)

const productSchema = new mongoose.Schema(
    {
        langs: {
            ar: {
                type: productLanguageSchema,
                required: true
            },
            en: {
                type: productLanguageSchema,
                required: true
            }
        },
        image: {
            type: String,
            required: true,
            trim: true
        },
        peopleCount: {
            type: Number,
            required: true,
            min: [1, "عدد الأشخاص يجب أن يكون على الأقل 1"],
            max: [1000, "عدد الأشخاص لا يتجاوز 1000"]
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            validate: {
                validator: async function (v) {
                    const Category = mongoose.model("Category")
                    const exists = await Category.findById(v)
                    return !!exists
                },
                message: "القسم غير موجود"
            }
        },
        status: {
            type: String,
            enum: ["1", "0"],
            default: "1"
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

productSchema.index({ categoryId: 1, created_at: -1 })

const Product = mongoose.model("Product", productSchema, "products")

module.exports = Product
