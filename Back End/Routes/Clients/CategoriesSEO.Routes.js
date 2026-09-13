const express = require("express")
const router = express.Router()
const categoriesSeoController = require("../../Controllers/Shared/categories_seo.controller")

router.route("/").get(categoriesSeoController.getCategorySeo)

module.exports = router
