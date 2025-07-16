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

  const orderCode = Date.now();

  const payosOrder = {
    amount: Math.round(amount),
    description,
    orderCode,
    returnUrl: `${baseUrlFE}/payment-success`,
    cancelUrl: `${baseUrlFE}/cancel.html`,
    extraData: JSON.stringify({
      userId: req.user.id,
      address,
      items: items.map((item) => ({
        productId: item.productId._id || item.productId,
        quantity: item.quantity,
      })),
      feeShipping,
      orderCode, // rất quan trọng để đồng bộ hóa
    }),
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
    console.log("Đã nhận webhook từ PayOS:", req.body);

    const payosCode = req.body.code;
    const data = req.body.data;

    const status = payosCode === "00" ? "PAID" : "FAILED";
    if (status !== "PAID") {
      return res.status(200).json({ message: "Thanh toán không thành công, bỏ qua" });
    }

    const { orderCode, transactionId, extraData } = data;
    if (!orderCode || !extraData) {
      return res.status(400).json({ message: "Thiếu orderCode hoặc extraData trong webhook" });
    }

    // Kiểm tra đơn hàng đã tồn tại chưa
    const existed = await Order.findOne({ orderCode });
    if (existed) {
      return res.status(200).json({ message: "Đơn hàng đã được tạo trước đó" });
    }

    // Parse extraData từ chuỗi JSON
    const parsedExtraData = JSON.parse(extraData);
    const { userId, address, feeShipping, items } = parsedExtraData;

    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || typeof product.price !== "number") continue;
      if (product.stock < item.quantity) continue;

      // Trừ tồn kho
      product.stock -= item.quantity;
      await product.save();

      totalPrice += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
      });
    }

    // Tính tổng giảm giá
    const discountTotal = orderItems.reduce((total, item) => {
      const goc = items.find((i) => i.productId.toString() === item.productId.toString());
      const price = goc?.price ?? 0;
      const discount = (goc?.discount ?? 0) / 100;
      return total + price * discount * item.quantity;
    }, 0);

    const finalPriceOrder = totalPrice - discountTotal + feeShipping;

    await Order.create({
      userId,
      items: orderItems,
      address,
      feeShipping,
      orderCode,
      transactionId,
      totalPrice,
      finalPriceOrder,
      paymentMethod: "QR",
      statusPayment: "Paid",
      statusOrder: "Processing",
    });

    res.status(200).json({ message: "Tạo đơn hàng thành công sau khi thanh toán" });
  } catch (err) {
    console.error("Lỗi khi xử lý webhook:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi xử lý webhook" });
  }
};

module.exports = { createPaymentLinkController, receiveHookFromPayOS };
