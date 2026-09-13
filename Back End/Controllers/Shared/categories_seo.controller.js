const CategorySeo = require("../../Models/categories_seo.model")
const Lang = require("../../Models/Langs.model")
const success = require("../../Res/success")
const notFound = require("../../Res/not_found")
const catchErrors = require("../../Middleware/utils/CatchErrors")

const getCategorySeo = catchErrors(
    "فشل جلب إعدادات SEO للأقسام",
    500
)(async (req, res) => {
    let seo = await CategorySeo.findOne().select("-__v")

    if (!seo) {
        const langs = await Lang.find().select("code name")

        if (!langs.length) {
            return notFound(res, "Languages")
        }

        const seoLangs = {}

        langs.forEach((lang) => {
            const defaultTitle = lang.code === "ar" ? "الأقسام" : "Categories"

            const defaultDescription =
                lang.code === "ar" ?
                    "تصفح جميع الأقسام والرحلات السياحية المتاحة"
                :   "Browse all available categories and tourism trips"

            seoLangs[lang.code] = {
                seoTitle: defaultTitle,
                seoDescription: defaultDescription,
                seoKeywords:
                    lang.code === "ar" ?
                        ["الأقسام", "رحلات سياحية", "سياحة"]
                    :   ["categories", "tourism", "trips"]
            }
        })

        seo = await CategorySeo.create({
            langs: seoLangs
        })
    }

    res.json(success(seo))
})

module.exports = {
    getCategorySeo
}
