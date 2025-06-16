const mongoose = require("mongoose");

const customSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  image: { type: String, required: true }, // base64 hoặc URL
  title: { type: String, default: "Thiết kế của tôi" },
  metadata: {
    width: Number,
    height: Number,
    background: String,
    elements: [mongoose.Schema.Types.Mixed], // để lưu layer design nếu cần
  },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const Custom = mongoose.model("Custom", customSchema);

module.exports = Custom;
