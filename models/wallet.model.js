const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;