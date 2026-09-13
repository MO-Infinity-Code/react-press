const express = require("express")
const router = express.Router()
const websiteSeoController = require("../../Controllers/Admin/website_seo.controller")
const sharedWebsiteSeoController = require("../../Controllers/Shared/website_seo.controller")
const verifyToken = require("../../Middleware/Admin/CheckIfAdminVerify.middleware")
const websiteSeoValidation = require("../../Validation/Admin/website/website.seo.validation")
const allowedTo = require("../../Middleware/Admin/allowedTo.middleware")

router
    .route("/")
    .get(verifyToken, allowedTo("Admin"), sharedWebsiteSeoController.getWebsiteSeo)
    .put(
        verifyToken,
        allowedTo("Admin"),
        websiteSeoValidation(),
        websiteSeoController.updateWebsiteSeo
    )

module.exports = router
