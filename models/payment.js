const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    paymentId: { type: String, required: true, trim: true },
    proofUrl: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Done"], default: "Pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);


// Payment Schema (already exists)
// const PaymentSchema = new mongoose.Schema({
//   userName: String,
//   status: { type: String, default: "Pending" },
//   paymentId: String,
//   proofUrl: String,
// });
// const Payment = mongoose.model("Payment", PaymentSchema);

// // ✅ New Todo Schema
// const TodoSchema = new mongoose.Schema({
//   userName: String,
//   task: String,
//   status: { type: String, default: "Pending" }
// });
// const Todo = mongoose.model("Todo", TodoSchema);
