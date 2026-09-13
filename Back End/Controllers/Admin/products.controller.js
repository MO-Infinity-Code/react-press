const Product = require("../../Models/Product.model")
const success = require("../../Res/success")
const catchErrors = require("../../Middleware/utils/CatchErrors")
const { validationResult } = require("express-validator")
const { saveBase64File } = require("../../Hooks/uploadImagesBase64")
const fs = require("fs")
const path = require("path")

const PRODUCT_UPLOAD_OPTIONS = {
    folder: "images/products",
    allowedTypes: "image/*",
    maxSizeMB: 5,
    prefix: "product"
}

const getOneProduct = catchErrors(
    "فشل جلب المنتج",
    500
)(async (req, res) => {
    const product = await Product.findById(req.params.id).populate("categoryId", "langs")
    if (!product) {
        return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    }
    res.json(success(product))
})

const createProduct = catchErrors(
    "فشل إنشاء المنتج",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
    }

    const { langs, image, peopleCount, categoryId, status } = req.body

    const uploadResult = saveBase64File(image, PRODUCT_UPLOAD_OPTIONS)
    if (!uploadResult.success) {
        return res.status(400).json({ success: false, message: uploadResult.error })
    }

    const product = await Product.create({
        langs,
        image: uploadResult.filePath,
        peopleCount,
        categoryId,
        status: status || "1"
    })

    res.json(success(product))
})

const updateProduct = catchErrors(
    "فشل تحديث المنتج",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
    }

    const product = await Product.findById(req.params.id)
    if (!product) {
        return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    }

    const updateData = {}
    if (req.body.langs) {
        updateData.langs = req.body.langs
    }
    if (req.body.peopleCount !== undefined) {
        updateData.peopleCount = req.body.peopleCount
    }
    if (req.body.categoryId !== undefined) {
        updateData.categoryId = req.body.categoryId
    }
    if (req.body.status !== undefined) {
        updateData.status = req.body.status
    }
    if (req.body.image) {
        const uploadResult = saveBase64File(req.body.image, PRODUCT_UPLOAD_OPTIONS)
        if (!uploadResult.success) {
            return res.status(400).json({ success: false, message: uploadResult.error })
        }
        if (product.image) {
            const oldPath = path.join(__dirname, "../../", product.image)
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath)
            }
        }
        updateData.image = uploadResult.filePath
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })
    res.json(success(updated))
})

const deleteProduct = catchErrors(
    "فشل حذف المنتج",
    500
)(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
        return res.status(404).json({ success: false, message: "المنتج غير موجود" })
    }

    if (product.image) {
        const imagePath = path.join(__dirname, "../../", product.image)
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
        }
    }

    res.json(success("تم حذف المنتج بنجاح"))
})

module.exports = {
    getOneProduct,
    createProduct,
    updateProduct,
    deleteProduct
}
