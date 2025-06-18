const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  addToCart,
  getCart,
  deleteCart,
  updateCart,
  deleteCartById,
  deleteProductFromToCard,
} = require("../controller/cart.controller");

const router = express.Router();

router.get("/", authenticateToken, getCart);
router.post("/add", authenticateToken, addToCart);
router.put("/update", authenticateToken, updateCart);
router.delete("/delete", authenticateToken, deleteCart);
router.delete("/:id", authenticateToken, deleteProductFromToCard);

module.exports = router;
