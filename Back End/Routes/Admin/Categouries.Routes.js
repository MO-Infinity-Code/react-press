const express = require("express")
const router = express.Router()
const categoriesController = require("../../Controllers/Admin/categories.controller")
const sharedCategoriesController = require("../../Controllers/Shared/categories.controller")
const verifyToken = require("../../Middleware/Admin/CheckIfAdminVerify.middleware")
const allowedTo = require("../../Middleware/Admin/allowedTo.middleware")
const categoryValidation = require("../../Validation/Admin/Categories/add.validation")
const updateCategoryValidation = require("../../Validation/Admin/Categories/edit.validation")

router
    .route("/")
    .get(verifyToken, allowedTo("Admin"), sharedCategoriesController.getAllCategories)
    .post(
        verifyToken,
        allowedTo("Admin"),
        categoryValidation(),
        categoriesController.createCategory
    )

router
    .route("/:id")
    .delete(verifyToken, allowedTo("Admin"), categoriesController.deleteCategory)
    .get(verifyToken, allowedTo("Admin"), categoriesController.getOneCategory)
    .put(
        verifyToken,
        updateCategoryValidation(),
        allowedTo("Admin"),
        categoriesController.updateCategory
    )

module.exports = router
