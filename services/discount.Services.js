const { default: mongoose } = require("mongoose");
const Discount = require("../models/discount.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const { calculateFinalPrice } = require("../utils/utils");

const getAllDiscount = (req) => {
  try {
    const list = Discount.find({});

    if (!list) {
      return res.status(404).json({
        message: "Không được danh sách khuyến mãi",
        success: false,
      });
    }
    return list;
  } catch (error) {
    throw new Error(error);
  }
};

const getDiscountById = async (id) => {
  try {
    const discount = await Discount.findById({ _id: id });

    console.log("discount", discount);

    if (!discount) {
      return res.status(404).json({
        message: "Không được danh sách khuyến mãi",
        success: false,
      });
    }
    return discount;
  } catch (error) {
    throw new Error(error);
  }
};

const createProductDiscount = async (req, res) => {
  const {
    name,
    description,
    discountType,
    value,
    applicableProducts = [],
    startDate,
    endDate,
    code,
    targetType,
  } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Người dùng không tìm thấy", success: false });
  }

  const invalidProducts = [];

  for (const productId of applicableProducts) {
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      invalidProducts.push(productId);
    }
  }

  if (invalidProducts.length > 0) {
    return res.status(400).json({
      message: "Một hoặc nhiều sản phẩm không hợp lệ hoặc đã bị vô hiệu hóa",
      invalidProducts,
      success: false,
    });
  }

  const savedDiscount = await Discount.create({
    name,
    description,
    discountType,
    value,
    applicableProducts,
    startDate,
    endDate,
    code,
    createdBy: user.username,
    targetType,
  });

  for (const productId of applicableProducts) {
    const product = await Product.findById(productId);
    product.currentDiscount = savedDiscount._id;

    const finalPrice = await calculateFinalPrice(product.price, savedDiscount);
    product.finalPrice = finalPrice;

    await product.save();
  }

  // Chỉ trả về dữ liệu discount thôi
  return savedDiscount;
};

const updateProductDiscount = async (id, req, res) => {
  const { name, description, discountType, value, applicableProducts = [], startDate, endDate, code } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tìm thấy",
        success: false,
      });
    }

    const invalidProducts = [];
    for (const productId of applicableProducts) {
      const product = await Product.findOne({ _id: productId, isActive: true });
      if (!product) {
        invalidProducts.push(productId);
      }
    }

    if (invalidProducts.length > 0) {
      return res.status(400).json({
        message: "Một hoặc nhiều sản phẩm không hợp lệ hoặc đã bị vô hiệu hóa",
        invalidProducts,
        success: false,
      });
    }

    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      {
        name,
        description,
        discountType,
        value,
        applicableProducts,
        startDate,
        endDate,
        code,
        editBy: user.username,
      },
      { new: true }
    );

    if (!updatedDiscount) {
      return res.status(404).json({
        message: "Giảm giá không tồn tại",
        success: false,
      });
    }

    for (const productId of applicableProducts) {
      const product = await Product.findById(productId);
      product.currentDiscount = savedDiscount._id;

      const finalPrice = await calculateFinalPrice(product.price, savedDiscount);
      product.finalPrice = finalPrice;

      await product.save();
    }

    return updatedDiscount;
  } catch (error) {
    console.log(error);
  }
};

const deactivateDiscount = async (id, reason) => {
  try {
    const discount = await Discount.findById(id);
    if (!discount) {
      throw new Error("Không tìm thấy khuyến mãi");
    }

    discount.isActive = false;
    discount.reason = reason;

    await discount.save();
    return discount;
  } catch (error) {
    throw new Error(error.message || "Đã xảy ra lỗi khi đình chỉ khuyến mãi");
  }
};

const activateDiscount = async (id, res) => {
  try {
    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({
        message: "Không tìm thấy khuyến mãi",
        success: false,
      });
    }

    discount.isActive = true;
    discount.reason = null;
    await discount.save();
    return discount;
  } catch (error) {
    console.log(error);
  }
};

const createOrderDiscount = async (req, res) => {
  const {
    name,
    description,
    discountType,
    value,
    applicableOrders = [],
    startDate,
    endDate,
    code,
    targetType,
  } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    const error = new Error("Người dùng không tìm thấy");
    error.statusCode = 404;
    throw error;
  }

  const invalidOrders = [];

  applicableOrders.forEach((orderID) => {
    if (!mongoose.Types.ObjectId.isValid(orderID) || orderID === "") {
      invalidOrders.push({ orderID, reason: "ID không hợp lệ" });
    }
  });

  if (invalidOrders.length > 0) {
    const error = new Error("Một hoặc nhiều đơn hàng không hợp lệ hoặc đã bị vô hiệu hóa");
    error.statusCode = 400;
    error.invalidOrders = invalidOrders;
    throw error;
  }

  const newDiscount = await Discount.create({
    name,
    description,
    discountType,
    value,
    applicableOrders,
    startDate,
    endDate,
    code,
    targetType,
    createdBy: user.username,
  });

  for (const orderID of applicableOrders) {
    console.log("orderID", orderID);

    const order = await Order.findById(orderID);
    order.currentDiscount = newDiscount._id;

    const finalPrice = await calculateFinalPrice(order.totalPrice, newDiscount);
    order.finalPriceOrder = finalPrice;

    await order.save();
  }

  return newDiscount;
};

const updateOrderDiscount = async (id, req) => {
  console.log("Req.body", req.body);

  const { name, description, discountType, value, applicableOrders, startDate, endDate, code } = req.body;

  console.log("applicableOrders", applicableOrders);

  const user = await User.findById(req.user.id);
  if (!user) {
    const error = new Error("Người dùng không tìm thấy");
    error.statusCode = 404;
    throw error;
  }

  const invalidOrders = [];
  const validOrderIds = [];

  applicableOrders.forEach((orderID) => {
    if (!mongoose.Types.ObjectId.isValid(orderID) || orderID === "") {
      invalidOrders.push({ orderID, reason: "ID không hợp lệ" });
    } else {
      validOrderIds.push(orderID);
    }
  });

  if (invalidOrders.length > 0) {
    const error = new Error("Một hoặc nhiều đơn hàng không hợp lệ hoặc đã bị vô hiệu hóa");
    error.statusCode = 400;
    error.invalidOrders = invalidOrders;
    throw error;
  }

  console.log("validOrderIds", validOrderIds);

  // Cập nhật discount
  const discount = await Discount.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        name,
        description,
        discountType,
        value,
        applicableOrders: validOrderIds,
        startDate,
        endDate,
        code,
        updatedBy: user.username,
        updatedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!discount) {
    const error = new Error("Mã giảm giá không tìm thấy");
    error.statusCode = 404;
    throw error;
  }

  const objectIds = validOrderIds.map((id) => new mongoose.Types.ObjectId(id));

  console.log("objectIds", objectIds);

  const orders = await Order.find({
    _id: { $in: objectIds },
  });

  console.log("orders", orders);

  if (orders.length === 0) {
    const error = new Error("Không tìm thấy đơn hàng nào hợp lệ để cập nhật");
    error.statusCode = 404;
    throw error;
  }

  const updatePromises = orders.map(async (order) => {
    order.currentDiscount = discount._id;

    const finalPrice = await calculateFinalPrice(order.totalPrice, discount);
    order.finalPriceOrder = finalPrice;

    if (order.feeShipping === undefined) {
      order.feeShipping = 0; // hoặc giá trị mặc định bạn muốn
    }

    await order.save();
  });

  await Promise.all(updatePromises);

  return discount;
};

module.exports = {
  getAllDiscount,
  createProductDiscount,
  updateProductDiscount,
  deactivateDiscount,
  activateDiscount,
  getDiscountById,
  createOrderDiscount,
  updateOrderDiscount,
};
