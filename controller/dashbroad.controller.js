const Order = require("../models/order.model");
const Product = require("../models/product.model");

const getDashbroadController = async (req, res) => {
  try {
    let { start, end, year, month } = req.query;

    let startDate, endDate;

    if (start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
      endDate.setDate(endDate.getDate() + 1);
    } else if (year && month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
      endDate.setDate(endDate.getDate() + 1);
    } else {
      return res.status(400).json({
        success: false,
        message: "Thiếu thời gian: truyền start/end hoặc year/month",
      });
    }

    const totalProducts = await Product.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate },
      statusPayment: "Paid",
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    return res.status(200).json({
      success: true,
      message: "Lấy thành công thông tin của dữ liệu",
      data: {
        totalProducts,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê dashboard",
    });
  }
};

module.exports = {
  getDashbroadController,
};
