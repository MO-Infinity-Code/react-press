const express = require("express")
const router = express.Router()
const websiteSeoController = require("../../Controllers/Shared/website_seo.controller")

router.route("/").get(websiteSeoController.getWebsiteSeo)

module.exports = router
