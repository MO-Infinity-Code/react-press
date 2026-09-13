const Product = require("../../Models/Product.model")
const Category = require("../../Models/Category.model")
const success = require("../../Res/success")
const catchErrors = require("../../Middleware/utils/CatchErrors")

const getAllProducts = catchErrors(
    "فشل جلب المنتجات",
    500
)(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit
    let categorySlug = req.query.categorySlug?.trim() || ""
    const lang = req.query.lang?.trim() || "ar"
    const search = req.query.search?.trim() || ""

    if (categorySlug) categorySlug = categorySlug.replace(/-/g, " ")
    const filter = {}

    if (categorySlug) {
        const category = await Category.findOne({
            [`langs.${lang}.seoTitle`]: {
                $regex: `^${categorySlug}$`,
                $options: "i"
            }
        }).select("_id")
        if (!category) {
            return res.json(
                success({
                    data: [],
                    pagination: {
                        total: 0,
                        page,
                        totalPages: 0,
                        limit
                    }
                })
            )
        }

        filter.categoryId = category._id
    }

    if (search) {
        filter.$expr = {
            $gt: [
                {
                    $size: {
                        $filter: {
                            input: { $objectToArray: "$langs" },
                            as: "lang",
                            cond: {
                                $regexMatch: {
                                    input: "$$lang.v.name",
                                    regex: search,
                                    options: "i"
                                }
                            }
                        }
                    }
                },
                0
            ]
        }
    }

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort({ created_at: -1 })
            .limit(limit)
            .skip(skip)
            .populate("categoryId", "langs"),
        Product.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limit)

    res.json(
        success({
            data: products,
            pagination: {
                total,
                page,
                totalPages,
                limit
            }
        })
    )
})

module.exports = {
    getAllProducts
}
