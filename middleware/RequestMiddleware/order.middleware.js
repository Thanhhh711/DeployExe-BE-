const Order = require("../../models/order.model");

const getOrderByIdForPayOs = async (req, res, next) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    req.order = order;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi lấy đơn hàng" });
  }
};

const createOrderMiddleware = async (req, res, next) => {
  const { items: cartItems, feeShipping, address } = req.body;
  const userId = req.user.id;

  try {
    let totalPrice = 0;
    const items = [];

    for (const item of cartItems) {
      const product = item.productId;

      if (!product || typeof product.price !== "number") {
        return res.status(400).json({ message: "Sản phẩm không hợp lệ", success: false });
      }

      const quantity = Number(item.quantity);
      if (!quantity || isNaN(quantity)) {
        return res.status(400).json({ message: `Số lượng không hợp lệ cho sản phẩm ${product.name}`, success: false });
      }

      if (typeof product.stock !== "number" || isNaN(product.stock)) {
        return res.status(400).json({ message: `Tồn kho không hợp lệ cho sản phẩm ${product.name}`, success: false });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ message: `Sản phẩm ${product.name} không đủ hàng`, success: false });
      }

      // Trừ tồn kho
      product.stock = product.stock - quantity;
      await product.save();

      totalPrice += product.price * quantity;
      items.push({ productId: product._id, quantity });
    }

    const discountTotal = items.reduce((total, item) => {
      const product = cartItems.find((i) => i.productId._id.toString() === item.productId.toString())?.productId;
      const price = product?.price ?? 0;
      const discount = (product?.discount ?? 0) / 100;
      return total + price * discount * item.quantity;
    }, 0);

    const finalPriceOrder = totalPrice - discountTotal + feeShipping;
    const orderCode = Date.now(); // phải đảm bảo nhỏ hơn 9007199254740991

    const order = await Order.create({
      userId,
      items,
      feeShipping,
      address,
      totalPrice,
      finalPriceOrder,
      orderCode,
      paymentMethod: "QR",
      statusPayment: "Pending",
      statusOrder: "Processing",
    });

    req.order = order;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tạo đơn hàng thất bại" });
  }
};

module.exports = { getOrderByIdForPayOs, createOrderMiddleware };
