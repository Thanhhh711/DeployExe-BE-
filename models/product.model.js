const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    rating: { type: Number },
    location: { type: String },
    picture: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    editby: {
      type: String,
    },
    isActive: { type: Boolean, default: true },
    currentDiscount: { type: mongoose.Schema.Types.ObjectId, ref: "Discount" },
    deactivationReason: { type: String, default: "" },
    finalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
