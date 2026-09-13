const express = require("express")
const router = express.Router()
const sharedProductsController = require("../../Controllers/Shared/products.controller")
const productsController = require("../../Controllers/Admin/products.controller")

router.route("/").get(sharedProductsController.getAllProducts)

router.route("/:id").get(productsController.getOneProduct)
module.exports = router
