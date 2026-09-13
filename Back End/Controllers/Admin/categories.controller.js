const { validationResult } = require("express-validator")
const Category = require("../../Models/Category.model")
const success = require("../../Res/success")
const catchErrors = require("../../Middleware/utils/CatchErrors")
const { saveBase64File } = require("../../Hooks/uploadImagesBase64")
const fs = require("fs")
const path = require("path")

const CATEGORY_UPLOAD_OPTIONS = {
    folder: "images/categories",
    allowedTypes: "image/*",
    maxSizeMB: 5,
    prefix: "category"
}
const createCategory = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
    }

    const { langs, image, status } = req.body

    const uploadResult = saveBase64File(image, CATEGORY_UPLOAD_OPTIONS)
    if (!uploadResult.success) {
        return res.status(400).json({ success: false, message: uploadResult.error })
    }

    const category = await Category.create({
        langs: langs,
        image: uploadResult.filePath,
        status: status || "1"
    })

    res.json(success(category))
}

const deleteCategory = catchErrors(
    "فشل حذف القسم",
    500
)(async (req, res) => {
    const category_id = req.params.id
    const category = await Category.findByIdAndDelete(category_id)
    if (!category) return res.status(404).json({ success: false, message: "القسم غير موجود" })

    if (category.image) {
        try {
            const imagePath = path.join(__dirname, "../../", category.image)
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath)
            } else {
                console.warn("الملف غير موجود:", imagePath)
            }
        } catch (err) {
            console.error("فشل حذف الصورة:", err)
        }
    }

    res.json(success("تم حذف القسم بنجاح"))
})

const getOneCategory = catchErrors(
    "فشل جلب القسم",
    500
)(async (req, res) => {
    const category_id = req.params.id
    const category = await Category.findById(category_id)
    if (!category) return res.status(404).json({ success: false, message: "القسم غير موجود" })
    const categoryObj = category.toObject()
    delete categoryObj.__v
    res.json(success(categoryObj))
})

const updateCategory = catchErrors(
    "فشل تحديث القسم",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
    }

    const category_id = req.params.id
    const category = await Category.findById(category_id)
    if (!category) {
        return res.status(404).json({ success: false, message: "القسم غير موجود" })
    }

    const updateData = {}
    if (req.body.langs) {
        updateData.langs = req.body.langs
    }
    if (req.body.status) {
        updateData.status = req.body.status
    }
    if (req.body.image) {
        const uploadResult = saveBase64File(req.body.image, CATEGORY_UPLOAD_OPTIONS)
        if (!uploadResult.success) {
            return res.status(400).json({ success: false, message: uploadResult.error })
        }
        if (category.image) {
            try {
                const oldImagePath = path.join(__dirname, "../../", category.image)
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath)
                }
            } catch (err) {
                console.error("فشل حذف الصورة القديمة:", err)
            }
        }
        updateData.image = uploadResult.filePath
    }

    const updated = await Category.findByIdAndUpdate(category_id, updateData, { new: true })
    res.json(success(updated))
})

module.exports = {
    createCategory,
    deleteCategory,
    getOneCategory,
    updateCategory
}
