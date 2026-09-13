const mongoose = require("mongoose")
const validator = require("validator")

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            validate: [
                {
                    validator: (v) => validator.isEmail(v),
                    message: "Invalid email"
                }
            ]
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            required: true,
            enum: ["Admin", "SuperAdmin", "Manager"]
        },

        token: {
            type: String
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
)

const Admin = mongoose.model("Admin", adminSchema, "admins")

module.exports = Admin
