const { validationResult } = require("express-validator")
const Lang = require("../../Models/Langs.model")
const success = require("../../Res/success")
const noData = require("../../Res/no_data")
const deletedSuccessfully = require("../../Res/deleted_successfully")
const notFound = require("../../Res/not_found")
const catchErrors = require("../../Middleware/utils/CatchErrors")

const getAllLangs = catchErrors(
    "Failed to fetch languages",
    500
)(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit
    const langs = await Lang.find().select("-__v").limit(limit).skip(skip)
    langs.length > 0 ? res.json(success(langs)) : res.json(noData())
})

const getOneLang = catchErrors(
    "Invalid Object ID",
    500
)(async (req, res) => {
    const lang_id = req.params.id
    const lang = await Lang.findById(lang_id).select("-__v")
    if (!lang) return notFound(res, "Language")
    res.json(success(lang))
})

const createLang = catchErrors(
    "Failed to create language",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json(errors.array())
    const { name, code } = req.body
    const lang = new Lang({
        name,
        code: code.toLowerCase(),
        created_at: new Date()
    })
    await lang.save()
    const langObj = lang.toObject()
    delete langObj.__v
    res.status(201).json(success(langObj))
})

const updateLang = catchErrors(
    "Failed to update language",
    500
)(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json(errors.array())
    const lang_id = req.params.id
    const lang = await Lang.findById(lang_id)
    if (!lang) return notFound(res, "Language")
    if (req.body.name) lang.name = req.body.name
    if (req.body.code) lang.code = req.body.code.toLowerCase()
    await lang.save()
    const langObj = lang.toObject()
    delete langObj.__v
    res.json(success(langObj))
})

const deleteLang = catchErrors(
    "Failed to delete language",
    500
)(async (req, res) => {
    const lang_id = req.params.id
    const lang = await Lang.findById(lang_id)
    if (!lang) return notFound(res, "Language")
    await Lang.findByIdAndDelete(lang_id)
    return deletedSuccessfully(res, "Language")
})

module.exports = {
    getAllLangs,
    getOneLang,
    createLang,
    updateLang,
    deleteLang
}
