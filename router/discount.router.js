const express = require("express");
const {
  getDiscountController,
  createProductDiscountController,

  deactivateDiscountController,

  activateDiscountController,
  getDiscountByIdController,
  updateDiscountForProductController,
  removeDiscountForProductController,

  createOrdersDiscountController,

  updateDiscountInfoController,
  updateDiscountInforOrderController,
  updateDiscountForOrderController,
  removeOrderForProductController,
} = require("../controller/discount.controller");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const { validateDiscount, validateApplicableOrders } = require("../middleware/RequestMiddleware/discount.middleware");

const router = express.Router();

// lấy tất cả
router.get("/", authenticateToken, authorizeRole("admin"), getDiscountController);

router.get("/:id", authenticateToken, authorizeRole("admin"), getDiscountByIdController);

// product
router.post("/product", authenticateToken, authorizeRole("admin"), validateDiscount, createProductDiscountController);

router.put(
  "/update/product/:discountId",
  authenticateToken,
  authorizeRole("admin"),
  validateDiscount,
  updateDiscountInfoController
);

// cậpk nhạt mã sản phẩm(chỉ dùng cho cập nhật mã)
router.patch("/discountProduct", authenticateToken, authorizeRole("admin"), updateDiscountForProductController);

router.patch(
  "/products/:productId/remove",
  authenticateToken,
  authorizeRole("admin"),
  removeDiscountForProductController
);

// order
router.post(
  "/order",
  authenticateToken,
  authorizeRole("admin"),
  validateDiscount,

  createOrdersDiscountController
);

router.put(
  "/update/order/:discountId",
  authenticateToken,
  authorizeRole("admin"),
  validateDiscount,
  updateDiscountInforOrderController
);

// chỉ để tạo mã
router.patch("/discountOrder", authenticateToken, authorizeRole("admin"), updateDiscountForOrderController);

router.patch("/orders/:orderId/remove", authenticateToken, authorizeRole("admin"), removeOrderForProductController);

// xóa mềm
router.patch("/deactivate/:id", authenticateToken, authorizeRole("admin"), deactivateDiscountController);

router.patch("/activate/:id", authenticateToken, authorizeRole("admin"), activateDiscountController);

module.exports = router;
