const express = require("express")
const router = express.Router()
const productController = require("../../Controllers/Admin/products.controller")
const sharedProductController = require("../../Controllers/Shared/products.controller")
const verifyToken = require("../../Middleware/Admin/CheckIfAdminVerify.middleware")
const allowedTo = require("../../Middleware/Admin/allowedTo.middleware")
const productValidation = require("../../Validation/Admin/Products/add.validation")
const updateProductValidation = require("../../Validation/Admin/Products/edit.validation")

router
    .route("/")
    .get(verifyToken, allowedTo("Admin"), sharedProductController.getAllProducts)
    .post(verifyToken, allowedTo("Admin"), productValidation(), productController.createProduct)
router
    .route("/:id")
    .get(verifyToken, allowedTo("Admin"), productController.getOneProduct)
    .put(
        verifyToken,
        allowedTo("Admin"),
        updateProductValidation(),
        productController.updateProduct
    )
    .delete(verifyToken, allowedTo("Admin"), productController.deleteProduct)

module.exports = router
