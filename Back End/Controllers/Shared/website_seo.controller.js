const WebsiteSeo = require("../../Models/website_seo.model")
const Lang = require("../../Models/Langs.model")
const success = require("../../Res/success")
const catchErrors = require("../../Middleware/utils/CatchErrors")

const getWebsiteSeo = catchErrors(
    "فشل جلب بيانات السيو",
    500
)(async (req, res) => {
    const langs = await Lang.find().select("code -_id")
    if (!langs.length) {
        return res.json(success({ langs: {} }))
    }

    let seo = await WebsiteSeo.findOne()
    if (!seo) {
        const defaultLangs = {}
        langs.forEach((lang) => {
            defaultLangs[lang.code] = {
                site_name: "test",
                site_description: "test",
                site_keywords: []
            }
        })
        seo = await WebsiteSeo.create({ langs: defaultLangs })
    } else {
        let updated = false
        langs.forEach((lang) => {
            if (!seo.langs || !seo.langs[lang.code]) {
                if (!seo.langs) seo.langs = {}
                seo.langs[lang.code] = {
                    site_name: "test",
                    site_description: "test",
                    site_keywords: []
                }
                updated = true
            }
        })
        if (updated) {
            await seo.save()
        }
    }

    res.json(success(seo))
})

module.exports = {
    getWebsiteSeo
}
