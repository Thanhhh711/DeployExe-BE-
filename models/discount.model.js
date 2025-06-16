const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },

    value: { type: Number, required: true },

    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    applicableOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    isActive: { type: Boolean, default: true },

    code: { type: String, unique: true, sparse: true },

    createdBy: { type: String },
    editBy: { type: String },
    reason: { type: String, default: null },

    targetType: {
      type: String,
      enum: ["product", "order"],
      required: true,
    },
  },
  { timestamps: true }
);

const Discount = mongoose.model("Discount", discountSchema);

module.exports = Discount;
