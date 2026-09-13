const CategorySeo = require("../../Models/categories_seo.model")
const success = require("../../Res/success")
const notFound = require("../../Res/not_found")
const catchErrors = require("../../Middleware/utils/CatchErrors")
const { validationResult } = require("express-validator")

const updateCategorySeo = catchErrors(
    "فشل تحديث إعدادات SEO للأقسام",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json(errors.array())
    const seo = await CategorySeo.findOne()
    if (!seo) return notFound(res, "Category SEO")
    if (req.body.langs) seo.langs = req.body.langs
    await seo.save()
    const seoObj = seo.toObject()
    delete seoObj.__v
    res.json(success(seoObj))
})

module.exports = {
    updateCategorySeo
}
