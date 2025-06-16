const express = require("express");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const Order = require("../models/order.model");

const mongoose = require("mongoose");
const Product = require("../models/product.model");
const getUserWithWalletController = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) {
      return res.status(401).json({ message: "Token không hợp lệ", success: false });
    }

    const user = await User.findById(userId).select("-password -passwordConfirm");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng", success: false });
    }

    const wallet = await Wallet.findOne({ userId: user.id });
    const walletAmount = wallet ? wallet.amount : 0;

    return res.status(200).json({
      message: "Thông tin người dùng cùng số dư ví",
      success: true,
      data: {
        ...user.toObject(),
        wallet: walletAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server có lỗi", success: false });
  }
};

const payWithWalletController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id || req.user._id;
    const { items, totalPrice, feeShipping, currentDiscount, address } = req.body;

    // Kiểm tra address
    if (!address || address.trim() === "") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Địa chỉ không được để trống" });
    }
    const user = await User.findById(userId).select("-password -passwordConfirm");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng", success: false });
    }
    const finalPriceOrder = totalPrice + feeShipping;

    if (!finalPriceOrder || finalPriceOrder <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Tổng số tiền thanh toán không hợp lệ" });
    }

    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Không tìm thấy ví của user" });
    }

    if (wallet.amount < finalPriceOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Số dư trong ví không đủ để thanh toán" });
    }

    // Trừ stock sản phẩm
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Không tìm thấy sản phẩm với ID: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Sản phẩm "${product.name}" không đủ hàng tồn kho` });
      }

      product.stock -= item.quantity;
      await product.save({ session });
    }

    // Trừ tiền ví
    wallet.amount -= finalPriceOrder;
    await wallet.save({ session });

    // Tạo đơn hàng
    const newOrder = new Order({
      userId,
      items,
      totalPrice,
      feeShipping,
      paymentMethod: "Wallet",
      statusPayment: "Paid",
      statusOrder: "Processing",
      currentDiscount: currentDiscount || null,
      finalPriceOrder,
      isActive: true,
      address,
    });

    await newOrder.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Thanh toán thành công bằng ví và tạo đơn hàng",
      data: {
        walletAmount: wallet.amount,
        order: newOrder,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Lỗi transaction:", error);
    return res.status(500).json({ message: "Lỗi server khi thanh toán", error: error.message });
  }
};

module.exports = payWithWalletController;

module.exports = { getUserWithWalletController, payWithWalletController };
