const PayOS = require("@payos/node");
const Order = require("../models/order.model");

const baseUrlFE = process.env.BASE_URL_FE;
const baseUrl = process.env.BASE_URL;
const payos = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY, {
  webhookUrl: `${baseUrl}/payOS/receive-hook`,
});

const createPaymentLinkController = async (req, res) => {
  const { items, feeShipping, address } = req.body;

  // Tính amount và description
  const amount =
    items.reduce((total, item) => {
      const price = item.productId.price ?? 0;
      const discount = (item.productId.discount ?? 0) / 100;
      const discountedPrice = price * (1 - discount);
      return total + discountedPrice * item.quantity;
    }, 0) + feeShipping;

  const description = items.map((item) => `${item.productId.name} x${item.quantity}`).join(", ");

  const orderCode = Date.now(); // Hoặc UUID cũng được

  const payosOrder = {
    amount: Math.round(amount),
    description,
    orderCode,
    returnUrl: `${baseUrlFE}/success.html`,
    cancelUrl: `${baseUrlFE}/cancel.html`,
  };

  try {
    const paymentLink = await payos.createPaymentLink(payosOrder);
    res.status(200).json({ checkoutUrl: paymentLink.checkoutUrl });
  } catch (err) {
    console.error("err", err);
    res.status(500).json({ message: "Tạo link thanh toán thất bại" });
  }
};

const receiveHookFromPayOS = async (req, res) => {
  try {
    console.log("Webhook received:", req.body);
    const { orderCode, status } = req.body; // orderCode từ PayOS gửi về

    // Tìm đơn hàng theo orderCode
    const order = await Order.findOne({ orderCode });

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Cập nhật trạng thái thanh toán
    if (status === "PAID") {
      order.statusPayment = "Paid";
      await order.save();
    } else if (status === "FAILED") {
      order.statusPayment = "Failed";
      await order.save();
    }

    res.status(200).json({ message: "Cập nhật trạng thái thanh toán thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi webhook" });
  }
};

module.exports = { createPaymentLinkController, receiveHookFromPayOS };
