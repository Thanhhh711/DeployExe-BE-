const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { addToCart, getCart, deleteCart, updateCart, deleteCartById } = require("../controller/cart.controller");

const router = express.Router();

router.get("/", authenticateToken, getCart);
router.post("/add", authenticateToken, addToCart);
router.put("/update", authenticateToken, updateCart);
router.delete("/delete", authenticateToken, deleteCart);
router.delete("/cart/:id", authenticateToken, deleteCartById);

module.exports = router;
