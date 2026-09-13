const Category = require("../../Models/Category.model")
const success = require("../../Res/success")
const catchErrors = require("../../Middleware/utils/CatchErrors")

const getAllCategories = catchErrors(
    "فشل جلب الأقسام",
    500
)(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search ? req.query.search.trim() : ""

    const matchStage =
        search ?
            {
                $match: {
                    $expr: {
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
            }
        :   { $match: {} }

    const [result] = await Category.aggregate([
        matchStage,
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $sort: { created_at: -1 } }, { $skip: skip }, { $limit: limit }]
            }
        }
    ])

    const total = result.metadata.length > 0 ? result.metadata[0].total : 0
    const categories = result.data
    const totalPages = Math.ceil(total / limit)

    res.json(
        success({
            data: categories,
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
    getAllCategories
}
