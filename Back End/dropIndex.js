const mongoose = require("mongoose")
require("dotenv").config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in .env file")
    process.exit(1)
}

mongoose
    .connect(DATABASE_URL)
    .then(async () => {
        console.log("✅ Connected to MongoDB")

        try {
            // حذف الفهرس المسمى "name_1" من مجموعة categories
            await mongoose.connection.collection("categories").dropIndex("name_1")
            console.log("✅ Index 'name_1' dropped successfully")
        } catch (err) {
            if (err.code === 27) {
                console.log("⚠️ Index 'name_1' does not exist, nothing to drop")
            } else {
                console.error("❌ Error dropping index:", err.message)
            }
        }

        // عرض الفهارس المتبقية للتأكد
        const indexes = await mongoose.connection.collection("categories").indexes()
        console.log("📌 Remaining indexes:", indexes.map((i) => i.name).join(", ") || "none")

        await mongoose.disconnect()
        console.log("✅ Disconnected from MongoDB")
        process.exit(0)
    })
    .catch((err) => {
        console.error("❌ Failed to connect to MongoDB:", err.message)
        process.exit(1)
    })
