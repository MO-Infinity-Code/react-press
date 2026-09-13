const mongoose = require("mongoose")

const langSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

const Lang = mongoose.model("Lang", langSchema, "langs")

module.exports = Lang
