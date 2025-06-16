const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const {
  getAllOrder,
  addOrder,
  getOrder,
  updatStatusOrder,
  getTopSellingProductsController,
  getOrderById,
  addOrderForOne,
} = require("../controller/order.controller");

const router = express.Router();

router.get("/", authenticateToken, getOrder);
router.get("/all", authenticateToken, authorizeRole("admin"), getAllOrder);
router.post("/create", authenticateToken, addOrder);

router.post("/createForOne", authenticateToken, addOrderForOne);

router.put("/updateStatus/:id", authenticateToken, updatStatusOrder);
router.get("/:orderId", authenticateToken, getOrderById);
// router.put("/update/:id", authenticateToken, updateOrder);
// router.delete("/delete/:id", authenticateToken, deleteOrderById);

router.get("/topSelling", authenticateToken, authorizeRole("admin"), getTopSellingProductsController);
module.exports = router;
