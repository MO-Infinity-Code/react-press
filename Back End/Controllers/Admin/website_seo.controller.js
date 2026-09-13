const WebsiteSeo = require("../../Models/website_seo.model")
const Lang = require("../../Models/Langs.model")
const success = require("../../Res/success")
const catchErrors = require("../../Middleware/utils/CatchErrors")
const { validationResult } = require("express-validator")
const validationWithLang = require("../../Res/validation_with_lang")

const updateWebsiteSeo = catchErrors(
    "فشل تحديث بيانات السيو",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return validationWithLang(errors, res)
    }

    const { langs } = req.body

    let seo = await WebsiteSeo.findOne()
    if (!seo) {
        const langsList = await Lang.find().select("code -_id")
        const defaultLangs = {}
        langsList.forEach((lang) => {
            defaultLangs[lang.code] = {
                site_name: "test",
                site_description: "test",
                site_keywords: []
            }
        })
        seo = new WebsiteSeo({ langs: defaultLangs })
    }

    if (langs) {
        for (const [code, data] of Object.entries(langs)) {
            if (seo.langs[code]) {
                if (data.site_name !== undefined) seo.langs[code].site_name = data.site_name
                if (data.site_description !== undefined)
                    seo.langs[code].site_description = data.site_description
                if (data.site_keywords !== undefined)
                    seo.langs[code].site_keywords = data.site_keywords
            }
        }
        await seo.save()
    }

    res.json(success(seo))
})

module.exports = {
    updateWebsiteSeo
}
