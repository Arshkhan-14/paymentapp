const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true }, // Payment amount
    status: { type: String, enum: ["Pending", "Done"], default: "Pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
