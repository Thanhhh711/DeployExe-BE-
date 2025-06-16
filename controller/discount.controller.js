const mongoose = require("mongoose");
const discountService = require("../services/discount.Services");
const Product = require("../models/product.model");
const Discount = require("../models/discount.model");
const { calculateFinalPrice } = require("../utils/utils");
const Order = require("../models/order.model");

const getDiscountController = async (req, res) => {
  try {
    const data = await discountService.getAllDiscount(req);

    return res.status(200).json({ message: "Lấy danh sách mã thành công", success: true, data: data });
  } catch (error) {
    console.log(error);
  }
};

const getDiscountByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await discountService.getDiscountById(id);

    return res.status(200).json({ message: "Lấy mã thành công", success: true, data: data });
  } catch (error) {
    console.log(error);
  }
};

const createProductDiscountController = async (req, res) => {
  try {
    const result = await discountService.createProductDiscount(req);

    return res.status(200).json({
      message: "Tạo mã giảm giá thành công",
      data: result,
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Tạo mã giảm giá thất bại",
      success: false,
    });
  }
};

const updateDiscountInfoController = async (req, res) => {
  try {
    const { discountId } = req.params;

    const result = await discountService.updateProductDiscount(discountId, req);

    return res.status(200).json({
      message: "Cập nhật mã giảm giá thành công",
      data: result,
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Tạo mã giảm giá thất bại",
      success: false,
    });
  }
};

// Đình chỉ
const deactivateDiscountController = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    console.log("reason", reason);

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        message: "Bạn phải cung cấp lý do đình chỉ",
        success: false,
      });
    }
    const result = await discountService.deactivateDiscount(id, reason);

    return res.status(200).json({
      message: "Đã đình chỉ thành công mã khuyến mãi",
      data: result,
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Tạo mã giảm giá thất bại",
      success: false,
    });
  }
};

const activateDiscountController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await discountService.activateDiscount(id, req);

    return res.status(200).json({
      message: "Mã khuyến mãi đã hoạt động trở lại",
      data: result,
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Tạo mã giảm giá thất bại",
      success: false,
    });
  }
};

// cập nhật mã
const updateDiscountForProductController = async (req, res) => {
  const { productId, discountId } = req.body;

  if (!productId || !discountId) {
    return res.status(400).json({
      message: "Thiếu thông tin sản phẩm hoặc mã giảm giá",
      success: false,
    });
  }

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa",
        success: false,
      });
    }

    const discount = await Discount.findById(discountId);
    if (!discount || !discount.isActive) {
      return res.status(404).json({
        message: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
        success: false,
      });
    }

    product.currentDiscount = discountId;

    if (!discount.applicableProducts.includes(productId)) {
      discount.applicableProducts.push(productId);
      await discount.save();
    }
    const finalPrice = await calculateFinalPrice(product.price, discountId);
    product.finalPrice = finalPrice;
    await product.save();

    return res.status(200).json({
      message: "Cập nhật giảm giá thành công",
      success: true,
      data: {
        productId: product._id,
        finalPrice,
        currentDiscount: discountId,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi cập nhật giảm giá sản phẩm",
      success: false,
    });
  }
};

const removeDiscountForProductController = async (req, res) => {
  const { productId } = req.params;
  const { discountId } = req.body;

  if (!productId || !discountId) {
    return res.status(400).json({
      message: "Thiếu thông tin sản phẩm hoặc mã giảm giá",
      success: false,
    });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm",
        success: false,
      });
    }

    if (product.currentDiscount && product.currentDiscount.toString() !== discountId) {
      return res.status(400).json({
        message: "Mã giảm giá không đúng với sản phẩm",
        success: false,
      });
    }

    product.currentDiscount = null;
    const finalPrice = await calculateFinalPrice(product.price);
    product.finalPrice = finalPrice;
    await product.save();

    const discount = await Discount.findById(discountId);
    if (!discount) {
      return res.status(404).json({
        message: "Mã giảm giá không tồn tại",
        success: false,
      });
    }

    const productIndex = discount.applicableProducts.indexOf(productId);
    if (productIndex !== -1) {
      discount.applicableProducts.splice(productIndex, 1);
      await discount.save();
    }

    return res.status(200).json({
      message: "Đã bỏ mã giảm giá khỏi sản phẩm",
      success: true,
      data: {
        productId: product._id,
        finalPrice,
        currentDiscount: null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi bỏ mã giảm giá khỏi sản phẩm",
      success: false,
    });
  }
};

// ---- order
const createOrdersDiscountController = async (req, res) => {
  try {
    console.log("disOrder", req);

    const result = await discountService.createOrderDiscount(req);

    return res.status(200).json({
      message: "Tạo mã giảm giá thành công cho đơn hàng",
      data: result,
      success: true,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Lỗi máy chủ",
      invalidOrders: error.invalidOrders || [],
      success: false,
    });
  }
};

// cập nhật thông tin của mã cho order
const updateDiscountInforOrderController = async (req, res) => {
  try {
    const { discountId } = req.params;
    const result = await discountService.updateOrderDiscount(discountId, req);
    return res.status(200).json({
      message: "Cập nhật mã giảm giá thành công",
      data: result,
      success: true,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Lỗi máy chủ",
      invalidOrders: error.invalidOrders || [],
      success: false,
    });
  }
};

// cập nhật mã cho order
const updateDiscountForOrderController = async (req, res) => {
  const { orderId, discountId } = req.body;

  if (!orderId || !discountId) {
    return res.status(400).json({
      message: "Thiếu thông tin đơn hàng hoặc mã giảm giá",
      success: false,
    });
  }

  try {
    // Kiểm tra đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
        success: false,
      });
    }

    if (!order.isActive) {
      return res.status(400).json({
        message: "Đơn hàng đã bị hủy hoặc không còn hiệu lực",
        success: false,
      });
    }

    // Kiểm tra mã giảm giá
    const discount = await Discount.findById(discountId);
    if (!discount || !discount.isActive) {
      return res.status(404).json({
        message: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
        success: false,
      });
    }

    order.currentDiscount = discountId;

    const finalAmount = await calculateFinalPrice(order.finalPriceOrder, discount);
    order.finalPriceOrder = finalAmount;

    await order.save();

    return res.status(200).json({
      message: "Cập nhật mã giảm giá cho đơn hàng thành công",
      success: true,
      data: {
        orderId: order._id,
        finalAmount,
        currentDiscount: discountId,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi cập nhật mã giảm giá cho đơn hàng",
      success: false,
    });
  }
};

const removeOrderForProductController = async (req, res) => {
  const { OrderId } = req.params;
  const { discountId } = req.body;
  if (!OrderId || !discountId) {
    return res.status(400).json({
      message: "Thiếu thông tin đơn hàng hoặc mã giảm giá",
      success: false,
    });
  }

  try {
    const order = await Order.findById(OrderId);
    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng",
        success: false,
      });
    }

    if (order.currentDiscount && order.currentDiscount.toString() !== discountId) {
      return res.status(400).json({
        message: "Mã giảm giá không đúng với đơn hàng",
        success: false,
      });
    }

    order.currentDiscount = null;
    const finalPrice = await calculateFinalPrice(order.totalPrice);
    order.finalPrice = finalPrice;
    await order.save();

    const discount = await Discount.findById(discountId);
    if (!discount) {
      return res.status(404).json({
        message: "Mã giảm giá không tồn tại",
        success: false,
      });
    }

    const OrderIndex = discount.applicableOrder.indexOf(OrderId);
    if (OrderIndex !== -1) {
      discount.applicableProducts.splice(OrderIndex, 1);
      await discount.save();
    }

    return res.status(200).json({
      message: "Đã bỏ mã giảm giá khỏi đơn hàng",
      success: true,
      data: {
        orderId: order._id,
        finalPrice,
        currentDiscount: null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi bỏ mã giảm giá khỏi đơn hàng",
      success: false,
    });
  }
};

module.exports = {
  getDiscountController,
  getDiscountByIdController,
  createProductDiscountController,
  updateDiscountInfoController,
  deactivateDiscountController,
  activateDiscountController,
  updateDiscountForProductController,
  removeDiscountForProductController,
  createOrdersDiscountController,
  updateDiscountInforOrderController,

  updateDiscountForOrderController,
  removeOrderForProductController,
};
