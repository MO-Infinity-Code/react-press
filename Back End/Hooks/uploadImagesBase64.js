const fs = require("fs")
const path = require("path")

function saveBase64File(base64String, options) {
    const { folder, allowedTypes, maxSizeMB = 5, prefix = "file" } = options

    if (!base64String || typeof base64String !== "string") {
        return { success: false, error: "الملف مطلوب" }
    }

    const matches = base64String.match(/^data:([\w/+.-]+);base64,(.+)$/)
    if (!matches) {
        return { success: false, error: "صيغة base64 غير صحيحة" }
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const isAllowed =
        allowedTypes === "image/*" ? mimeType.startsWith("image/") : allowedTypes.includes(mimeType)

    if (!isAllowed) {
        return {
            success: false,
            error: `نوع الملف غير مدعوم`
        }
    }

    const buffer = Buffer.from(base64Data, "base64")

    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (buffer.length > maxSizeBytes) {
        return { success: false, error: `حجم الملف يجب ألا يتجاوز ${maxSizeMB} ميجابايت` }
    }

    const extension = mimeType.split("/")[1].split("+")[0]
    const fileName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`

    const uploadDir = path.join(process.cwd(), "uploads", folder)
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fullPath = path.join(uploadDir, fileName)
    fs.writeFileSync(fullPath, buffer)

    const relativePath = path.join("uploads", folder, fileName).replace(/\\/g, "/")

    return { success: true, filePath: relativePath }
}

function deleteFile(filePath) {
    if (!filePath) return
    const fullPath = path.join(process.cwd(), filePath)
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
    }
}

module.exports = { saveBase64File, deleteFile }
