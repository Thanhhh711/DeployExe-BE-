const bcrypt = require("bcryptjs");
const User = require("../models/user.model"); // Adjust the path to your user model
const { signToken } = require("../middleware/authMiddleware");
const Wallet = require("../models/wallet.model");

const login = async (req) => {
  try {
    const userRequest = req.user;

    if (!userRequest.isActive) {
      throw new Error("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.");
    }

    const token = signToken({ id: userRequest._id, role: userRequest.role });
    const login = async (req) => {
      try {
        const userRequest = req.user;

        if (!userRequest.isActive) {
          throw new Error("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.");
        }

        const token = signToken({ id: userRequest._id, role: userRequest.role });

        const user = await getMe(userRequest._id);

        await Wallet.create({ userId: userRequest._id, amount: 0 });

        return { token, user };
      } catch (error) {
        throw new Error(error.message || "Login failed");
      }
    };

    const user = await getMe(userRequest._id);

    // 4. Tạo ví nếu chưa có
    await Wallet.create({ userId: userRequest._id, amount: 0 });

    return { token, user };
  } catch (error) {
    throw new Error(error.message || "Login failed");
  }
};

const register = async (req) => {
  const { email, password, username, role, passwordConfirm } = req.body;

  const newUser = await User.create({
    username,
    email,
    password,
    passwordConfirm,
    fullName: req.body.fullName || "Không có thông tin",
    phone: req.body.phone || "Không có số điện thoại",
    address: req.body.address || "Không có địa chỉ",
    date_of_birth: req.body.date_of_birth || null,
    avatar: req.body.avatar || "default-avatar.png",
    role: role || "user",
    loginLocations: [{ location: req.ip || "Unknown" }],
    cart: [],
    orders: [],
    isActive: true,
    defaultPaymentMethod: req.body.defaultPaymentMethod || "cash",
  });

  const token = signToken({ id: newUser._id, role: newUser.role });
  return token;
};

const getMe = (idUser) => {
  const result = User.findById(idUser).select("email username fullName phone address avatar date_of_birth role ");

  if (!result) {
    return res.status(404).json({
      message: "User not found",
      success: false,
    });
  }
  return result;
};

const udpateProfileUser = async (req, data) => {
  const { email, username, phone, address, avatar, date_of_birth, fullName } = data;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      email,
      username,
      address,
      date_of_birth,
      phone,
      avatar,
      fullName,
    },
    { new: true }
  ).select("email username fullName phone address avatar date_of_birth "); // Chỉ lấy các trường này
  return user;
};

module.exports = {
  login,
  register,
  getMe,
  udpateProfileUser,
};
