const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

const getOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId }).populate({
      path: "items.productId",
      select: "name price picture finalPrice",
    });

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "Không có order" });
    }

    return res.json({
      success: true,
      message: "Danh sách đơn hàng",
      data: orders.map((order) => ({
        _id: order._id,
        address: order.address,
        statusOrder: order.statusOrder,
        totalPrice: order.totalPrice,
        finalPriceOrder: order.finalPriceOrder,
        paymentMethod: order.paymentMethod,
        statusPayment: order.statusPayment,
        feeShipping: order.feeShipping,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          productId: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          finalPrice: item.productId.finalPrice,
          picture: item.productId.picture,
          quantity: item.quantity,
          totalItemPrice: item.productId.finalPrice * item.quantity,
        })),
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

const getAllOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);

    const cartItems = await Order.find({});

    if (!cartItems.length) {
      return res.status(404).json({ success: false, message: "Không có order" });
    }

    return res.json({ success: true, data: cartItems, message: "Order" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

const addOrder = async (req, res) => {
  const userId = req.user.id;
  const statusOrder = "Processing";
  const { paymentMethod, statusPayment, feeShipping, address } = req.body;

  if (!address || address.trim() === "") {
    return res.status(400).json({
      message: "Địa chỉ không được để trống",
      success: false,
    });
  }

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại", success: false });
    }

    // ✅ Sửa ở đây: thêm stock vào select
    const cartItems = await Cart.find({ userId }).populate({
      path: "productId",
      select: "price name stock", // <- THÊM `stock` ở đây!
    });

    if (!cartItems.length) {
      return res.status(400).json({ message: "Giỏ hàng trống", success: false });
    }

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

      // ✅ Kiểm tra thêm để tránh lỗi NaN
      if (typeof product.stock !== "number" || isNaN(product.stock)) {
        return res.status(400).json({ message: `Tồn kho không hợp lệ cho sản phẩm ${product.name}`, success: false });
      }

      // Kiểm tra tồn kho
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Sản phẩm ${product.name} không đủ hàng`, success: false });
      }

      // Trừ tồn kho
      product.stock = product.stock - quantity;
      await product.save();

      totalPrice += product.price * quantity + feeShipping;
      items.push({ productId: product._id, quantity });
    }

    const order = new Order({
      userId,
      items,
      totalPrice,
      paymentMethod,
      statusPayment,
      statusOrder,
      feeShipping,
      address,
    });

    await order.save();
    await Cart.deleteMany({ userId });

    return res.status(200).json({
      message: "Đặt hàng thành công",
      data: order,
      success: true,
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    return res.status(500).json({ message: "Lỗi server", success: false, error: error.message });
  }
};

//
const addOrderForOne = async (req, res) => {
  const userId = req.user.id;
  const statusOrder = "Processing";
  const { paymentMethod, statusPayment, feeShipping = 0, items } = req.body;

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại", success: false });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Danh sách sản phẩm không được rỗng", success: false });
    }

    const normalizedItems = items.map((item) => {
      if (typeof item === "string") return { productId: item, quantity: 1 };
      return item;
    });

    const productIds = normalizedItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: "Có sản phẩm không tồn tại", success: false });
    }

    let totalPrice = 0;
    const validItems = [];

    for (const item of normalizedItems) {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) {
        return res.status(400).json({ message: `Sản phẩm với id ${item.productId} không tồn tại`, success: false });
      }

      const quantity = Number(item.quantity);
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: `Số lượng sản phẩm ${item.productId} không hợp lệ`, success: false });
      }

      const pricePerUnit = product.finalPrice || product.price || 0;
      totalPrice += pricePerUnit * quantity;

      validItems.push({ productId: product._id, quantity });
    }

    totalPrice += feeShipping;

    const order = new Order({
      userId,
      items: validItems,
      totalPrice,
      paymentMethod,
      statusPayment,
      statusOrder,
      feeShipping,
      finalPriceOrder: totalPrice,
    });

    const savedOrder = await order.save();
    console.log("Order đã lưu vào DB:", savedOrder);

    // Xóa giỏ hàng người dùng sau khi đặt hàng
    await Cart.deleteMany({ userId });

    return res.status(200).json({
      message: "Đặt hàng thành công",
      data: order,
      success: true,
    });
  } catch (error) {
    console.error("Lỗi server:", error);
    return res.status(500).json({ message: "Lỗi server", success: false, error: error.message });
  }
};

const updatStatusOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusOrder, reason } = req.body;

    if (statusOrder === "Cancel" && (!reason || reason.trim() === "")) {
      return res.status(400).json({
        message: "Phải cung cấp lý do khi hủy đơn hàng",
        success: false,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tìm thấy", success: false });
    }

    order.statusOrder = statusOrder;

    if (statusOrder === "Cancel") {
      order.reason = reason;
    } else {
      order.reason = "";
    }

    await order.save();

    return res.status(200).json({ message: "Cập nhật thành công", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false, error: error.message });
  }
};

const getTopSellingProductsController = async (req, res) => {
  try {
    const topSellingProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $sort: { totalSold: -1 },
      },

      {
        $project: {
          _id: 0,
          productId: "$_id",
          totalSold: 1,
          productName: "$productInfo.name",
          productPrice: "$productInfo.price",
          productImage: "$productInfo.picture",
          stock: "$productInfo.stock",
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: topSellingProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy sản phẩm bán chạy nhất",
    });
  }
};

const getOrderById = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findOne({ _id: orderId })
      .populate({
        path: "items.productId",
        select: "name description price rating location picture stock categories currentDiscount finalPrice",
        populate: {
          path: "categories currentDiscount",
          select: "name code discountPercent",
        },
      })
      .populate({
        path: "currentDiscount",
        select: "code discountPercent",
      });

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại", success: false });
    }

    const itemsWithDetails = order.items.map((item) => {
      const product = item.productId;
      return {
        productId: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        rating: product.rating,
        location: product.location,
        picture: product.picture,
        stock: product.stock,
        categories: product.categories,
        currentDiscount: product.currentDiscount,
        finalPrice: product.finalPrice,
        quantity: item.quantity,
        totalItemPrice: product.finalPrice * item.quantity,
      };
    });

    return res.status(200).json({
      message: "Lấy đơn hàng thành công",
      data: {
        ...order.toObject(),
        address: order.address,
        items: itemsWithDetails,
      },
      success: true,
    });
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng theo ID:", error);
    return res.status(500).json({ message: "Lỗi server", success: false });
  }
};

module.exports = {
  addOrder,
  getAllOrder,
  getOrder,
  updatStatusOrder,
  getTopSellingProductsController,
  getOrderById,
  addOrderForOne,
};
