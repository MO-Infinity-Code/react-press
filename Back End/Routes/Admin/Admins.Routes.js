const express = require("express")
const router = express.Router()
const adminsController = require("../../Controllers/Admin/admin.controller")
const registerValidation = require("../../Validation/Admin/Admins/register.validation")
const loginValidation = require("../../Validation/Admin/Admins/login.validation")
const verifyToken = require("../../Middleware/Admin/CheckIfAdminVerify.middleware")
const allowedTo = require("../../Middleware/Admin/allowedTo.middleware")

// const AddNewAdminValidation = require("../Middlewares/Admins/AddNewAdmin.Middleware")
router.route("/").get(verifyToken, allowedTo("Admin"), adminsController.getAllAdmins)
router.route("/register").post(registerValidation(), adminsController.register)
router.route("/login").post(loginValidation(), adminsController.login)

// .post(AddNewAdminValidation(), adminsController.AddNewAdmin)
router.route("/:id").get(verifyToken, adminsController.getOneAdmin)
// .patch(adminsController.UpdateAdmin)
// .delete(adminsController.deleteAdmin)

module.exports = router
