const User = require("../../models/user.model");
const bcrypt = require("bcryptjs");

const validator = require("validator");

const loginValidator = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Cung cấp đủ email và mật khẩu" });
  }

  // Tìm người dùng trong cơ sở dữ liệu theo email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Email và mật khẩu không hợp lệ" });
  }

  if (typeof password !== "string" || typeof user.password !== "string") {
    return res.status(400).json({ message: "Sai định dạng mật khẩu" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  // Nếu mật khẩu không khớp
  if (!isMatch) {
    return res.status(401).json({ message: "Email và mật khẩu không hợp lệ" });
  }

  req.user = user;
  // If successful
  next();
};

const registerValidator = async (req, res, next) => {
  // Lấy các giá trị từ body request
  const { email, password, passwordConfirm, username, role } = req.body;

  if (!email || !password || !passwordConfirm || !username) {
    return res.status(401).json({
      message: "Các thông tin bắt buộc: email, mật khẩu, xác nhận mật khẩu, username.",
      success: false,
    });
  }

  // Kiểm tra xem mật khẩu và mật khẩu
  if (password !== passwordConfirm) {
    return res.status(401).json({
      message: "Mật khẩu không khớp",
      success: false,
    });
  }

  const userRole = role || "customer";

  // Kiểm tra xem email đã tồn tại chưa
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(401).json({
      message: "Email đã tồn tại",
      success: false,
    });
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(401).json({
      message: "Username đã tồn tại",
      success: false,
    });
  }

  req.body.role = userRole;

  next();
};

const updateValidator = async (req, res, next) => {
  console.log("req", req);

  const { email, username, address, phone, avatar, date_of_birth } = req.body;

  console.log("req.body", email);

  // Kiểm tra các trường bắt buộc
  if (!email || !username) {
    return res.status(400).json({
      message: "Email và username là bắt buộc",
      success: false,
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      message: "Email không hợp lệ",
      success: false,
    });
  }

  // (Tùy chọn) Kiểm tra định dạng số điện thoại
  if (phone && !validator.isMobilePhone(phone, "vi-VN")) {
    return res.status(400).json({
      message: "Số điện thoại không hợp lệ",
      success: false,
    });
  }

  // kiểm tra coi là ngta có ngày sinh phá mình hok
  if (date_of_birth) {
    const date = new Date(date_of_birth);
    const now = new Date();

    if (isNaN(date.getTime()) || date > now) {
      return res.status(400).json({
        message: "Ngày sinh không hợp lệ hoặc lớn hơn ngày hiện tại",
        success: false,
      });
    }
  }

  // Nếu hợp lệ -> tiếp tục
  next();
};

const forgotPasswordValidator = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Bạn chưa nhập email." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Email không hợp lệ." });
  }

  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res.status(404).json({ message: "Không tìm thấy người dùng với email này." });
  }

  req.user = existingUser;

  next();
};

//  reset
const resetPasswordValidator = (req, res, next) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  if (!resetToken) {
    return res.status(400).json({
      message: "Token không hợp lệ. Vui lòng kiểm tra lại liên kết.",
      success: false,
    });
  }

  if (!newPassword) {
    return res.status(400).json({
      message: "Bạn chưa nhập mật khẩu mới.",
      success: false,
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      success: false,
    });
  }

  next();
};

const passwordChangeValidator = async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({
      message: "Vui lòng cung cấp đủ thông tin: mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.",
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      message: "Mật khẩu mới và xác nhận mật khẩu mới không khớp.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Mật khẩu mới phải có ít nhất 8 ký tự.",
    });
  }

  next();
};

module.exports = {
  loginValidator,
  registerValidator,
  updateValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  passwordChangeValidator,
};
