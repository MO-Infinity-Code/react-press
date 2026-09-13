const mongoose = require("mongoose")

const languageSchema = new mongoose.Schema(
    {
        seoTitle: {
            type: String,
            required: true,
            trim: true
        },
        seoDescription: {
            type: String,
            required: true,
            trim: true
        },
        seoKeywords: {
            type: [String],
            default: []
        }
    },
    {
        _id: false
    }
)

const categoriesSeoSchema = new mongoose.Schema(
    {
        langs: {
            ar: {
                type: languageSchema,
                required: true
            },
            en: {
                type: languageSchema,
                required: true
            }
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

const CategoriesSeo = mongoose.model("CategoriesSeo", categoriesSeoSchema, "categories_seo")

module.exports = CategoriesSeo
