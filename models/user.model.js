const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add username"],
      unique: true,
      trim: true,
      minlength: 3, // Sửa minlenght -> minlength
      maxlength: 30, // Sửa maxlenght -> maxlength
      index: true,
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },

    fullName: {
      type: String,
      required: false,
      trim: true,
    },

    role: {
      type: String,
      required: [true, "Please provide role"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 8,
      // select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],

      select: false, // Ẩn passwordConfirm khỏi kết quả truy vấn
    },

    phone: {
      type: String,
      select: true,
    },

    address: {
      type: String,
      select: true,
    },

    //  lưu theo kiểu JSON nhashas ku
    date_of_birth: {
      type: Date,
      select: true,
    },

    avatar: {
      type: String,
      select: true,
    },

    loginLocations: [
      {
        location: String,
        timestamp: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    //  trạng thaí hạot động
    isActive: {
      type: Boolean,
      default: true,
    },
    // lý do
    deactivatedReason: {
      type: String,
      default: null,
      trim: true,
    },

    deactivatedAt: {
      type: Date,
      default: null,
    },

    //  token cấp khi qquen mk
    forgot_password_token: {
      type: String,
      default: null,
    },

    forgot_password_expiry: {
      type: Date,
      default: null,
    },

    // cart này là người dugnf bỏ giở(cập nhật sau)
    cart: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        selected: { type: Boolean, default: true }, // để đánh dấu nếu người dùng tick chọn để mua
      },
    ],

    //  những đơn hàng đã mua(cập nhật sau)
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    // phuongw thức thanh toán (cập nhật sau)
    defaultPaymentMethod: {
      type: String,
      enum: ["cash", "credit_card", "paypal"],
      default: "cash",
    },

    wallet: {
      type: Number,
      default: 0,
      min: 0,
    },
  },

  { timestamps: true }
);

userSchema.pre("save", async function name(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
