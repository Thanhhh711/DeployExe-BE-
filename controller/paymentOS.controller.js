const PayOS = require("@payos/node");
const Order = require("../models/order.model");
require("dotenv").config();

const baseUrlFE = process.env.BASE_URL_FE;
const baseUrl = process.env.BASE_URL;

const payos = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY);

const createPaymentLinkController = async (req, res) => {
  const { items, feeShipping, address } = req.body;

  // Tính amount
  const amount =
    items.reduce((total, item) => {
      const price = item.productId.price ?? 0;
      const discount = (item.productId.discount ?? 0) / 100;
      const discountedPrice = price * (1 - discount);
      return total + discountedPrice * item.quantity;
    }, 0) + feeShipping;

  // Tạo mô tả rút gọn
  let description = `${items[0].productId.name} x${items[0].quantity}`;
  if (items.length > 1) {
    description += ` và ${items.length - 1} sản phẩm khác`;
  }

  if (description.length > 25) {
    description = description.slice(0, 22) + "...";
  }

  const orderCode = req.order.orderCode;

  const payosOrder = {
    // amount: 10000,
    amount: Math.round(amount),
    description,
    orderCode,
    returnUrl: `${baseUrlFE}/payment-success`,
    cancelUrl: `${baseUrlFE}/cancel.html?orderCode=${orderCode}`,
  };

  try {
    const paymentLink = await payos.createPaymentLink(payosOrder);
    res.status(200).json({ checkoutUrl: paymentLink.checkoutUrl });
  } catch (err) {
    console.error("err", err?.response?.data || err);
    res.status(500).json({ message: "Tạo link thanh toán thất bại" });
  }
};

const receiveHookFromPayOS = async (req, res) => {
  try {
    console.log("Webhook received:", req.body);

    const payosCode = req.body.code;
    const data = req.body.data;

    const orderCode = data?.orderCode;

    console.log("orderCode", orderCode);

    const status = payosCode === "00" ? "PAID" : "FAILED";

    if (!orderCode) {
      return res.status(400).json({ message: "Thiếu orderCode trong webhook" });
    }

    const order = await Order.findOne({ orderCode });

    console.log("order", order);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (status === "PAID") {
      order.statusPayment = "Paid";
    } else {
      order.statusPayment = "Failed";
    }

    await order.save();

    res.status(200).json({ message: "Cập nhật trạng thái thanh toán thành công" });
  } catch (err) {
    console.error("Lỗi webhook:", err);
    res.status(500).json({ message: "Lỗi webhook" });
  }
};

module.exports = { createPaymentLinkController, receiveHookFromPayOS };
