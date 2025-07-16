const express = require("express");
const { createPaymentLinkController, receiveHookFromPayOS } = require("../controller/paymentOS.controller");
const { createOrderMiddleware } = require("../middleware/RequestMiddleware/order.middleware");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// router.post("/create-payment-link/:orderId", getOrderByIdForPayOs, createPaymentLink);
// router.post("/create-payment-link", authenticateToken, createOrderMiddleware, createPaymentLinkController);

// router.post("/receive-hook", receiveHookFromPayOS);
router.post("/create-payment-link", authenticateToken, createPaymentLinkController);

router.post("/receive-hook", receiveHookFromPayOS);

module.exports = router;
