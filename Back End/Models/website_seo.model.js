const mongoose = require("mongoose")

const seoLanguageSchema = new mongoose.Schema(
    {
        site_name: {
            type: String,
            required: true,
            trim: true
        },
        site_description: {
            type: String,
            required: true,
            trim: true
        },
        site_keywords: {
            type: [String],
            required: true,
            default: [],
            validate: [
                {
                    validator: (v) => v.every((item) => item.trim().length > 0),
                    message: "Keywords cannot contain empty values"
                }
            ]
        }
    },
    {
        _id: false
    }
)

const websiteSeoSchema = new mongoose.Schema(
    {
        langs: {
            ar: {
                type: seoLanguageSchema,
                required: true
            },
            en: {
                type: seoLanguageSchema,
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

const WebsiteSeo = mongoose.model("WebsiteSeo", websiteSeoSchema, "website_seo")

module.exports = WebsiteSeo
