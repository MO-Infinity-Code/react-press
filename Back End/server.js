require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const url = process.env.DATABASE_URL
mongoose
    .connect(url)
    .then(() => {
        console.log("Connected to MongoDB")
    })
    .catch((err) => {
        console.error("Mongo Error:")
        console.error(err)
    })
const app = express()
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
/*==========================================================================================*/
/* Routes Folders */

// Admins
const adminsRoutes = require("./Routes/Admin/Admins.Routes")
const langsRoutes = require("./Routes/Admin/Langs.Routes")
const websiteSeoRoutes = require("./Routes/Admin/website_seo.Routes")
const categoriesRoutes = require("./Routes/Admin/Categouries.Routes")
const categoriesSeoRoutes = require("./Routes/Admin/CategoriesSEO.Routes")
const productsRoutes = require("./Routes/Admin/Products.Routes")
// Clients
const clientCategoriesRoutes = require("./Routes/Clients/Categouries.Routes")
const clientProductsRoutes = require("./Routes/Clients/Products.Routes")
const clientWebsiteSeoRoutes = require("./Routes/Clients/website_seo.Routes")
const clientCategoriesSeoRoutes = require("./Routes/Clients/CategoriesSEO.Routes")

/*==========================================================================================*/
/* Routes List */
app.use(express.json())

// Admins
app.use("/api/admins/langs", langsRoutes)
app.use("/api/admins/website-seo", websiteSeoRoutes)
app.use("/api/admins/categories", categoriesRoutes)
app.use("/api/admins/categories-seo", categoriesSeoRoutes)
app.use("/api/admins/products", productsRoutes)
app.use("/api/admins", adminsRoutes)

// Clients
app.use("/api/clients/categories", clientCategoriesRoutes)
app.use("/api/clients/categories-seo", clientCategoriesSeoRoutes)
app.use("/api/clients/products", clientProductsRoutes)
app.use("/api/clients/website-seo", clientWebsiteSeoRoutes)
// Shared
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))
/*==========================================================================================*/

app.use((req, res) => {
    res.status(404).json("NOT FOUND")
})
app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
})
