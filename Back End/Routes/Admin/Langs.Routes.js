const express = require("express")
const router = express.Router()
const langsController = require("../../Controllers/Admin/langs.controller")
const createLangValidation = require("../../Validation/Admin/Langs/create.lang.validation")
const updateLangValidation = require("../../Validation/Admin/Langs/update.lang.validation")
// const registerValidation = require("../../Validation/Admin/Admins/register.validation")
// const loginValidation = require("../../Validation/Admin/Admins/login.validation")
// const verifyToken = require("../../Middleware/Admin/CheckIfAdminVerify.middleware")
// const allowedTo = require("../../Middleware/Admin/allowedTo.middleware")

// const AddNewAdminValidation = require("../Middlewares/Admins/AddNewAdmin.Middleware")
router
    .route("/")
    .get(langsController.getAllLangs)
    .post(createLangValidation(), langsController.createLang)
router
    .route("/:id")
    .get(langsController.getOneLang)
    .patch(updateLangValidation(), langsController.updateLang)
    .delete(langsController.deleteLang)

module.exports = router
