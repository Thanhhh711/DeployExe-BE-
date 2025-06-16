const { body, validationResult } = require("express-validator");
const Discount = require("../../models/discount.model");
const Product = require("../../models/product.model");
const Order = require("../../models/order.model");

const validateDiscount = [
  body("name").notEmpty().withMessage("Tên là bắt buộc"),
  body("description").optional().isString(),
  body("discountType").optional().isIn(["percentage", "fixed"]).withMessage("Loại giảm giá không hợp lệ"),
  body("value").isFloat({ gt: 0 }).withMessage("Giá trị giảm giá phải lớn hơn 0"),
  body("startDate").isISO8601().withMessage("Ngày bắt đầu không hợp lệ"),
  body("endDate").isISO8601().withMessage("Ngày kết thúc không hợp lệ"),
  body("isActive").optional().isBoolean(),
  body("code")
    .optional()
    .matches(/^[a-zA-Z0-9\-]+$/)
    .isLength({ min: 3, max: 20 })
    .withMessage("Mã code không hợp lệ"),
  body("targetType").isIn(["product", "order"]).withMessage("Loại mục tiêu phải là 'product' hoặc 'order'"),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: errors.array().map((e) => e.msg),
        success: false,
      });
    }

    const allowedFields = [
      "name",
      "description",
      "discountType",
      "value",
      "applicableProducts",
      "applicableOrders",
      "startDate",
      "endDate",
      "isActive",
      "code",
      "targetType",
    ];

    const extraFields = Object.keys(req.body).filter((key) => !allowedFields.includes(key));
    if (extraFields.length > 0) {
      return res.status(400).json({
        message: "Có trường không hợp lệ được gửi lên",
        invalidFields: extraFields,
        success: false,
      });
    }

    const { startDate, endDate, code, applicableProducts, applicableOrders, targetType } = req.body;

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
        success: false,
      });
    }

    if (code) {
      const existingDiscount = await Discount.findOne({ code });
      if (existingDiscount && existingDiscount._id.toString() !== req.params.discountId) {
        return res.status(400).json({
          message: "Mã giảm giá đã tồn tại",
          success: false,
        });
      }
    }

    // --- Validate theo loại ---
    if (String(targetType).toLowerCase() === "product") {
      if (!Array.isArray(applicableProducts)) {
        return res.status(400).json({
          message: "Danh sách sản phẩm không hợp lệ",
          success: false,
        });
      }

      // Lọc bỏ rỗng/khoảng trắng
      const cleanProductIds = applicableProducts.filter((id) => typeof id === "string" && id.trim() !== "");

      if (cleanProductIds.length === 0) {
        return res.status(400).json({
          message: "Danh sách sản phẩm không được rỗng hoặc chứa giá trị không hợp lệ",
          success: false,
        });
      }

      const foundProducts = await Product.find({ _id: { $in: cleanProductIds } });
      const foundIds = foundProducts.map((p) => p._id.toString());

      const invalidIds = cleanProductIds.filter((id) => !foundIds.includes(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          message: "Một hoặc nhiều sản phẩm không tồn tại",
          invalidProducts: invalidIds,
          success: false,
        });
      }

      if (applicableOrders?.length > 0) {
        return res.status(400).json({
          message: "Không được gửi danh sách đơn hàng nếu là giảm giá theo sản phẩm",
          success: false,
        });
      }
    } else if (String(targetType).toLowerCase() === "order") {
      if (!Array.isArray(applicableOrders)) {
        return res.status(400).json({
          message: "Danh sách đơn hàng không hợp lệ",
          success: false,
        });
      }

      const cleanOrderIds = applicableOrders.filter((id) => typeof id === "string" && id.trim() !== "");

      if (cleanOrderIds.length === 0) {
        return res.status(400).json({
          message: "Danh sách đơn hàng không được rỗng hoặc chứa giá trị không hợp lệ",
          success: false,
        });
      }

      const foundOrders = await Order.find({ _id: { $in: cleanOrderIds } });
      const foundIds = foundOrders.map((o) => o._id.toString());

      const invalidIds = cleanOrderIds.filter((id) => !foundIds.includes(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          message: "Một hoặc nhiều đơn hàng không tồn tại",
          invalidOrders: invalidIds,
          success: false,
        });
      }

      if (applicableProducts?.length > 0) {
        return res.status(400).json({
          message: "Không được gửi danh sách sản phẩm nếu là giảm giá theo đơn hàng",
          success: false,
        });
      }
    }

    next();
  },
];

module.exports = { validateDiscount };
