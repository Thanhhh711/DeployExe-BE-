const Custom = require("../models/custom.model");
const User = require("../models/user.model");
const { customeService } = require("../services/custome.Services");

const getAllCustomController = async (req, res) => {
  try {
    const customs = await Custom.find({}).populate("user", "username email phone").populate("product", "name");

    if (!customs || customs.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy danh sách custom",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Danh sách custom",
      data: customs,
      success: true,
    });
  } catch (error) {
    console.error("Lỗi khi lấy custom:", error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình lấy danh sách thiết kế",
      success: false,
    });
  }
};

const createCustomController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        message: "Thiếu ID người dùng",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại",
        success: false,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Thiếu ảnh thiết kế",
        success: false,
      });
    }

    const customeData = {
      user: user._id,
      product: req.body.productId, // nếu gửi từ client
      title: req.body.title, // nếu gửi từ client
    };

    const custom = await customeService(customeData, req.file);

    return res.status(200).json({
      message: "Thiết kế đã được gửi thành công",
      data: custom,
      success: true,
    });
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    return res.status(500).json({
      message: error.message || "Thêm thiết kế thất bại",
      success: false,
    });
  }
};

module.exports = {
  getAllCustomController,

  createCustomController,
};
