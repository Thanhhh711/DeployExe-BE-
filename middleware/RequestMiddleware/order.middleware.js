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
  const { items, feeShipping, address } = req.body;
  const userId = req.user.id;
  console.log("items:", items);
  console.log("feeShipping:", feeShipping);
  console.log("address:", address);
  console.log("userId:", userId);
  try {
    const statusOrder = "Processing";
    const totalPrice = items.reduce((total, item) => {
      const price = item.productId.price ?? 0;
      return total + price * item.quantity;
    }, 0);

    const discountTotal = items.reduce((total, item) => {
      const price = item.productId.price ?? 0;
      const discount = (item.productId.discount ?? 0) / 100;
      return total + price * discount * item.quantity;
    }, 0);

    const finalPriceOrder = totalPrice - discountTotal + feeShipping;

    const orderCode = Date.now().toString();

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
      statusOrder,
    });

    req.order = order;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tạo đơn hàng thất bại" });
  }
};

module.exports = { getOrderByIdForPayOs, createOrderMiddleware };
