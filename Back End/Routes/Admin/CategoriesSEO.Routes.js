const express = require("express")
const router = express.Router()
const categoriesSeoController = require("../../Controllers/Admin/categories_seo.controller")
const sharedCategoriesSeoController = require("../../Controllers/Shared/categories_seo.controller")
const verifyToken = require("../../Middleware/Admin/CheckIfAdminVerify.middleware")
const categoriesSeoValidation = require("../../Validation/Admin/categories/seo.validation")
const allowedTo = require("../../Middleware/Admin/allowedTo.middleware")

router
    .route("/")
    .get(verifyToken, allowedTo("Admin"), sharedCategoriesSeoController.getCategorySeo)
    .put(
        verifyToken,
        allowedTo("Admin"),
        categoriesSeoValidation(),
        categoriesSeoController.updateCategorySeo
    )

module.exports = router
