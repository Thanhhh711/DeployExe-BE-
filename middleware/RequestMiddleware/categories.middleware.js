const Category = require("../../models/category.model");
const { body, validationResult } = require("express-validator");

const categoryValidator = [
  body("title")
    .notEmpty()
    .withMessage("Tên danh mục không được để trống.")
    .isLength({ min: 3 })
    .withMessage("Tên danh mục phải có ít nhất 3 ký tự.")
    .trim(),

  body("description").optional().isLength({ max: 500 }).withMessage("Mô tả không được dài quá 500 ký tự."),

  body("products").optional().isArray().withMessage("Sản phẩm phải là một mảng."),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg);
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ.",
        errors: errorMessages,
      });
    }

    try {
      const { title } = req.body;
      const id = req.params.id;

      let categoryExists;

      if (id) {
        categoryExists = await Category.findOne({ title, _id: { $ne: id } });
      } else {
        categoryExists = await Category.findOne({ title });
      }

      if (categoryExists) {
        return res.status(400).json({
          message: `Danh mục với tên "${title}" đã tồn tại.`,
        });
      }

      next(); // Nếu không có lỗi thì tiếp tục xử lý request
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi trong quá trình kiểm tra danh mục.",
      });
    }
  },
];

module.exports = categoryValidator;
