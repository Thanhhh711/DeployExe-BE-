const Discount = require("../models/discount.model");

const calculateFinalPrice = async (price, discountId) => {
  if (!discountId) return price;

  try {
    const discount = await Discount.findById(discountId);

    if (!discount) {
      throw new Error("Mã giảm giá không tồn tại.");
    }

    const now = new Date();
    const { discountType, value, startDate, endDate, isActive } = discount;

    if (!isActive || now < new Date(startDate) || now > new Date(endDate)) {
      return price;
    }

    if (discountType === "percentage") {
      return price - (price * value) / 100;
    } else if (discountType === "fixed") {
      return Math.max(price - value, 0);
    }

    return price;
  } catch (error) {
    console.error("Lỗi khi tính giá:", error);
    return price;
  }
};

module.exports = { calculateFinalPrice };
