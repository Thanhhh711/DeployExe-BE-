const { body, validationResult } = require("express-validator");

const productValidator = [
  body("name").notEmpty().withMessage("Tên sản phẩm là bắt buộc").isString().withMessage("Tên sản phẩm phải là chuỗi"),

  body("description").optional().isString().withMessage("Mô tả phải là chuỗi"),

  body("price")
    .notEmpty()
    .withMessage("Giá là bắt buộc")
    .isNumeric()
    .withMessage("Giá phải là số")
    .custom((value) => value > 0)
    .withMessage("Giá phải lớn hơn 0"),

  body("rating").optional().isFloat({ min: 0, max: 5 }).withMessage("Đánh giá phải từ 0 đến 5"),

  body("location").optional().isString().withMessage("Địa điểm phải là chuỗi"),

  body("picture").optional().isString().withMessage("Ảnh phải là chuỗi"),

  body("stock").optional().isInt({ min: 0 }).withMessage("Tồn kho phải là số nguyên không âm"),

  body("categories")
    .optional()
    .isArray()
    .withMessage("Categorys phải là mảng các ID")
    .custom((arr) => arr.every((id) => typeof id === "string"))
    .withMessage("Mỗi category phải là một ID"),

  body("editby").optional().isString().withMessage("Người chỉnh sửa phải là chuỗi"),

  body("isActive").optional().isBoolean().withMessage("isActive phải là true hoặc false"),

  body("currentDiscount").optional().isMongoId().withMessage("Discount không hợp lệ"),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg);
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ.",
        errors: errorMessages,
      });
    }
    next();
  },
];

module.exports = productValidator;
