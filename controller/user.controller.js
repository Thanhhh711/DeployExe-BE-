const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { signToken, getIp } = require("../middleware/authMiddleware");
const { blacklist } = require("../middleware/authMiddleware");
const { default: axios } = require("axios");
const userSerivce = require("../services/user.Services");
const { cloudinary } = require("../utils/cloudinary");
const { getDataUri } = require("../utils/datauri");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

require("dotenv").config();

const userSignupController = async (req, res) => {
  try {
    const token = await userSerivce.register(req);
    return res.status(200).json({ success: true, data: { token: token } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Đã có lỗi",
    });
  }
};

const userLoginController = async (req, res) => {
  try {
    const result = await userSerivce.login(req);

    return res.status(200).json({ message: "Đăng nhập thành công", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi phía server" });
  }
};

const userLogoutController = async (req, res) => {
  try {
    console.log("logout");

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "Không nhận được token", success: false });
    }

    blacklist.add(token);
    return res.status(200).json({
      message: "Đăng xuất thành công",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi server",
      success: false,
    });
  }
};

const userGetMyController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Lỗi xác thực",
        success: false,
      });
    }
    const user = await userSerivce.getMe(req.user.id);
    res.json({
      message: "Đã có thông tin",
      success: true,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi phía Server",
      success: false,
    });
  }
};

const userUpdateProfileControler = async (req, res) => {
  try {
    //  phân rar lấy thông tin từ body nè NÍ
    const data = { ...req.body };
    const file = req.file;

    if (file) {
      const fileUri = getDataUri(file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri);
      data.avatar = cloudResponse.secure_url;
    }

    const user = await userSerivce.udpateProfileUser(req, data);
    if (!user) {
      return res.status(401).json({
        message: "Không tìm thấy người dùng",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Cập nhật thành công",
      data: { user },
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

const forgotPasswordController = async (req, res) => {
  const { email } = req.user;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      message: "Email không tồn tại trong hệ thống",
      success: false,
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.forgot_password_token = resetToken;
  user.forgot_password_expiry = Date.now() + 3600000; // Token hết hạn sau 1 giờ

  // Lưu thông tin token vào database
  await user.save();

  console.log("resetToken", resetToken);

  // Gửi email với token
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.PASSWORD_FAKE,
    },
  });

  //  Mày thay chỗ này bằng url của client nhé
  const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

  await transporter.sendMail({
    to: email,
    subject: "Yêu cầu đặt lại mật khẩu",
    text: `Vui lòng nhấp vào liên kết dưới đây để đặt lại mật khẩu của bạn: ${resetURL}`,
  });

  return res.status(200).json({
    message: "Đã gửi email hướng dẫn đặt lại mật khẩu.",
    success: true,
  });
};

const resetPasswordController = async (req, res) => {
  const { newPassword } = req.body;
  const { resetToken } = req.params;

  try {
    const user = await User.findOne({
      forgot_password_token: resetToken,
      forgot_password_expiry: { $gt: Date.now() }, // check coi là có hết hạn á
    });

    if (!user) {
      return res.status(400).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        success: false,
      });
    }

    user.password = newPassword; // (Mã hóa mật khẩu trong schema 'pre-save' nếu cần)

    // Xóa token sau khi đã đổi mật khẩu
    user.forgot_password_token = undefined;
    user.forgot_password_expiry = undefined;

    await user.save();

    return res.status(200).json({
      message: "Mật khẩu đã được thay đổi thành công.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Có lỗi xảy ra. Vui lòng thử lại.",
      error: err.message,
    });
  }
};

const changePasswordController = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Tìm cus
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      message: "Người dùng không tồn tại.",
      success: false,
    });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      message: "Mật khẩu hiện tại không đúng.",
      success: false,
    });
  }

  console.log(" user.password ", user.password);

  // Cập nhật mật khẩu mới  nè
  user.password = newPassword;
  await user.save();

  return res.status(200).json({
    message: "Mật khẩu đã được thay đổi thành công.",
    success: true,
  });
};

const userUpdateProfileById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticatedc",
        success: false,
      });
    }
    const idUser = req.params.id;
    const { email, username } = req.body;
    if (!email || !username) {
      return res.status(401).json({
        message: "Some thing missing",
        success: false,
      });
    }
    const user = await User.findByIdAndUpdate(
      idUser,
      {
        email,
        username,
      },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Update success",
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

const getAllUser = async (req, res) => {
  try {
    const user = await User.find({}).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "Dont have infomation",
        success: false,
      });
    }
    return res.status(201).json({
      data: user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const { message } = req.body;

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

    // Cấm xóa người dùng có quyền admin
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Không thể xóa người dùng có quyền admin",
        success: false,
      });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({
        message: "Lý do vô hiệu hóa người dùng là bắt buộc",
        success: false,
      });
    }

    //  Cái này gọi là xóa mềm nhéss
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        deactivatedReason: message,
        deactivatedAt: new Date(),
      },
      { new: true }
    );

    // Thông báo thành công
    return res.status(200).json({
      message: `Người dùng '${updatedUser.username}' đã bị vô hiệu hóa thành công.`,
      success: true,
    });
  } catch (error) {
    console.error("Lỗi xóa người dùng:", error);
    return res.status(500).json({
      message: "Lỗi server nội bộ",
      success: false,
    });
  }
};

const enableUserByIdController = async (req, res) => {
  try {
    const userId = req.params.id;
    const { message } = req.body;

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

    //  Cái này gọi là xóa mềm nhéss
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        deactivatedReason: "",
        deactivatedAt: new Date(),
      },
      { new: true }
    );

    // Thông báo thành công
    return res.status(200).json({
      message: `Tài khoản của '${updatedUser.username}' đã được khôi phục.`,
      success: true,
    });
  } catch (error) {
    console.error("Lỗi xóa người dùng:", error);
    return res.status(500).json({
      message: "Lỗi server nội bộ",
      success: false,
    });
  }
};

const refreshToken = async (req, res) => {
  const authHeaer = req.headers["authorization"];
  const token = authHeaer && authHeaer.split(" ")[1];
  if (!req.user) {
    return res.status(401).json({
      message: "Dont have token",
      success: false,
    });
  }
  const user = await User.findById(req.user.id);
  const refreshToken = signToken({ id: user.id, role: user.role });
  blacklist.add(token);
  return res.status(200).json({
    message: "refreshToken create success",
    refreshToken: refreshToken,
    success: true,
  });
};

module.exports = {
  userSignupController,
  userLoginController,
  userLogoutController,
  userGetMyController,
  userUpdateProfileControler,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  getAllUser,
  deleteUserById,
  refreshToken,
  userUpdateProfileById,
  enableUserByIdController,
};
