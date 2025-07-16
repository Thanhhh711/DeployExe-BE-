// const PayOS = require("@payos/node");
// const Order = require("../models/order.model");
// require("dotenv").config();

// const baseUrlFE = process.env.BASE_URL_FE;
// const baseUrl = process.env.BASE_URL;

// const payos = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY);

// const createPaymentLinkController = async (req, res) => {
//   const { items, feeShipping, address } = req.body;

//   // Tính amount
//   const amount =
//     items.reduce((total, item) => {
//       const price = item.productId.price ?? 0;
//       const discount = (item.productId.discount ?? 0) / 100;
//       const discountedPrice = price * (1 - discount);
//       return total + discountedPrice * item.quantity;
//     }, 0) + feeShipping;

//   // Tạo mô tả rút gọn
//   let description = `${items[0].productId.name} x${items[0].quantity}`;
//   if (items.length > 1) {
//     description += ` và ${items.length - 1} sản phẩm khác`;
//   }

//   if (description.length > 25) {
//     description = description.slice(0, 22) + "...";
//   }

//   const orderCode = req.order.orderCode;

//   const payosOrder = {
//     // amount: 10000,
//     amount: Math.round(amount),
//     description,
//     orderCode,
//     returnUrl: `${baseUrlFE}/payment-success`,
//     cancelUrl: `${baseUrlFE}/cancel.html`,
//   };

//   try {
//     const paymentLink = await payos.createPaymentLink(payosOrder);
//     res.status(200).json({ checkoutUrl: paymentLink.checkoutUrl });
//   } catch (err) {
//     console.error("err", err?.response?.data || err);
//     res.status(500).json({ message: "Tạo link thanh toán thất bại" });
//   }
// };

// const receiveHookFromPayOS = async (req, res) => {
//   try {
//     console.log("Webhook received:", req.body);

//     const payosCode = req.body.code;
//     const data = req.body.data;

//     const orderCode = data?.orderCode;

//     console.log("orderCode", orderCode);

//     const status = payosCode === "00" ? "PAID" : "FAILED";

//     if (!orderCode) {
//       return res.status(400).json({ message: "Thiếu orderCode trong webhook" });
//     }

//     const order = await Order.findOne({ orderCode });

//     console.log("order", order);

//     if (!order) {
//       return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
//     }

//     if (status === "PAID") {
//       order.statusPayment = "Paid";
//     } else {
//       order.statusPayment = "Failed";
//     }

//     await order.save();

//     res.status(200).json({ message: "Cập nhật trạng thái thanh toán thành công" });
//   } catch (err) {
//     console.error("Lỗi webhook:", err);
//     res.status(500).json({ message: "Lỗi webhook" });
//   }
// };

// module.exports = { createPaymentLinkController, receiveHookFromPayOS };

const PayOS = require("@payos/node");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
require("dotenv").config();

const baseUrlFE = process.env.BASE_URL_FE;
const payos = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY);

const createPaymentLinkController = async (req, res) => {
  const { items, feeShipping, address } = req.body;

  const amount =
    items.reduce((total, item) => {
      const price = item.productId.price ?? 0;
      const discount = (item.productId.discount ?? 0) / 100;
      const discountedPrice = price * (1 - discount);
      return total + discountedPrice * item.quantity;
    }, 0) + feeShipping;

  let description = `${items[0].productId.name} x${items[0].quantity}`;
  if (items.length > 1) {
    description += ` và ${items.length - 1} sản phẩm khác`;
  }
  if (description.length > 25) {
    description = description.slice(0, 22) + "...";
  }

  const orderCode = Date.now(); // unique identifier

  const payosOrder = {
    amount: Math.round(amount),
    description,
    orderCode,
    returnUrl: `${baseUrlFE}/payment-success`,
    cancelUrl: `${baseUrlFE}/cancel.html`,
    extraData: JSON.stringify({
      userId: req.user.id,
      address,
      feeShipping,
      items: items.map((item) => ({
        productId: item.productId._id || item.productId,
        quantity: item.quantity,
        price: item.productId.price,
        discount: item.productId.discount,
      })),
    }),
  };

  try {
    const paymentLink = await payos.createPaymentLink(payosOrder);
    res.status(200).json({ checkoutUrl: paymentLink.checkoutUrl });
  } catch (err) {
    console.error("Lỗi khi tạo link thanh toán:", err?.response?.data || err);
    res.status(500).json({ message: "Tạo link thanh toán thất bại" });
  }
};

const receiveHookFromPayOS = async (req, res) => {
  try {
    console.log("Webhook nhận từ PayOS:", req.body);

    const payosCode = req.body.code;
    const data = req.body.data;
    const status = payosCode === "00" ? "PAID" : "FAILED";

    if (status !== "PAID") {
      return res.status(200).json({ message: "Bỏ qua: Thanh toán không thành công" });
    }

    const { orderCode, transactionId, extraData } = data;

    if (!orderCode || !extraData) {
      return res.status(400).json({ message: "Thiếu orderCode hoặc extraData" });
    }

    const existed = await Order.findOne({ orderCode });
    if (existed) {
      return res.status(200).json({ message: "Đơn hàng đã tồn tại" });
    }

    const parsedExtraData = JSON.parse(extraData);
    const { userId, address, feeShipping, items } = parsedExtraData;

    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || typeof product.price !== "number" || product.stock < item.quantity) continue;

      product.stock -= item.quantity;
      await product.save();

      totalPrice += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ message: "Không có sản phẩm hợp lệ để tạo đơn" });
    }

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
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = { createPaymentLinkController, receiveHookFromPayOS };
