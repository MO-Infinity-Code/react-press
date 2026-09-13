const mongoose = require("mongoose")

const languageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
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

const categorySchema = new mongoose.Schema(
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
        },

        image: {
            type: String,
            required: true,
            trim: true
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

const Category = mongoose.model("Category", categorySchema, "categories")

module.exports = Category
