const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    title: { type: String, require: true, unique: true },
    description: { type: String },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isActive: {
      type: Boolean,
      default: true,
    },
    reason: {
      type: String,
      default: "", // hoặc bạn có thể bỏ default nếu muốn
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
