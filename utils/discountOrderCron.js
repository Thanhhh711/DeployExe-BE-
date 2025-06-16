const { default: nodeCron } = require("node-cron");
const Discount = require("../models/discount.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");

const startDiscountOrderCronJob = () => {
  console.log("🚀 Đã khởi động cron job");

  // Đây là cập nhật mỗi giờ nha Justin
  nodeCron.schedule("0 * * * *", async () => {
    console.log("⏰ Cron job đang chạy...");
    try {
      const now = new Date();

      const expiredDiscounts = await Discount.find({
        endDate: { $lt: now },
        isActive: true,
      });

      for (const discount of expiredDiscounts) {
        if (!discount.targetType) {
          console.log("⚠️ Discount thiếu targetType:", discount._id);
          discount.targetType = "product";
        }

        discount.isActive = false;
        await discount.save();

        const affectedProducts = await Product.find({ currentDiscount: discount._id });
        console.log(`🛍️ Product affected: ${affectedProducts.length}`);

        for (const product of affectedProducts) {
          product.currentDiscount = null;
          product.finalPrice = product.price;
          await product.save();
        }

        const affectedOrders = await Order.find({ currentDiscount: discount._id });
        console.log(`📦 Order affected: ${affectedOrders.length}`);

        for (const order of affectedOrders) {
          order.currentDiscount = null;
          order.totalPrice = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
          await order.save();
        }
      }

      console.log(`✅ Đã xử lý ${expiredDiscounts.length} discount hết hạn.`);
    } catch (err) {
      console.error("❌ Lỗi khi chạy cron job:", err.message);
    }
  });
};

module.exports = startDiscountOrderCronJob;
