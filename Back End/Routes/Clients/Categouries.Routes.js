const express = require("express")
const router = express.Router()
const sharedCategoriesController = require("../../Controllers/Shared/categories.controller")
const categoriesController = require("../../Controllers/Admin/categories.controller")

router.route("/").get(sharedCategoriesController.getAllCategories)

router.route("/:id").get(categoriesController.getOneCategory)
module.exports = router
