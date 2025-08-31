// // import dotenv from "dotenv";
// // dotenv.config();
// // import express from "express";
// // import path from "path";
// // import mongoose from "mongoose";
// // import multer from "multer";
// // import cloudinary from "cloudinary";

// // const app = express();

// // // Middleware
// // app.use(express.urlencoded({ extended: true }));
// // app.use(express.static(path.join(process.cwd(), "public")));
// // app.set("view engine", "ejs");

// // // MongoDB Connect
// // mongoose.connect(process.env.MONGO_URI)
// //   .then(() => console.log("✅ MongoDB Connected"))
// //   .catch(err => console.log(err));

// // // Cloudinary Config
// // cloudinary.v2.config({
// //   cloud_name: process.env.CLOUD_NAME,
// //   api_key: process.env.CLOUD_API_KEY,
// //   api_secret: process.env.CLOUD_API_SECRET,
// // });

// // // Multer Storage
// // const storage = multer.diskStorage({
// //   destination: "./uploads",
// //   filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
// // });
// // const upload = multer({ storage });

// // // Mongo Schema
// // const PaymentSchema = new mongoose.Schema({
// //   userName: String,
// //   status: { type: String, default: "Pending" },
// //   paymentId: String,
// //   proofUrl: String,
// // });
// // const Payment = mongoose.model("Payment", PaymentSchema);

// // // Routes
// // app.get("/", async (req, res) => {
// //   const userName = "Arsh Khan"; // Example user
// //   const latestStatus = "Pending"; // Example status
// //   res.render("index", { userName, latestStatus });
// // });

// // app.post("/submit", upload.single("proof"), async (req, res) => {
// //   try {
// //     const { name, paymentId } = req.body;
// //     const result = await cloudinary.v2.uploader.upload(req.file.path);

// //     const newPayment = await Payment.create({
// //       userName: name,
// //       paymentId,
// //       proofUrl: result.secure_url,
// //     });

// //     res.render("success", { payment: newPayment });
// //   } catch (err) {
// //     console.log(err);
// //     res.send("Error uploading");
// //   }
// // });

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
  

import express from "express";
import path from "path";
import mongoose from "mongoose";
import multer from "multer";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
//import Payment from "./models/payment";

dotenv.config();
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));
app.set("view engine", "ejs");

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// Cloudinary Config
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Multer Storage
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Mongo Schema
const PaymentSchema = new mongoose.Schema({
  userName: String,
  status: { type: String, default: "Pending" },
  paymentId: String,
  proofUrl: String,
});
const Payment = mongoose.model("Payment", PaymentSchema);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true ,default:"arsh"},
    amount: { type: Number, required: true ,default:100}, // Payment amount
    status: { type: String, enum: ["Pending", "Done","Under Review"], default: "Pending" }
  },
  { timestamps: true }
);
const Users=mongoose.model("Users",userSchema);

// ✅ ROUTES
app.get("/", async (req, res) => {
   const payuser = await Users.find().sort({ _id: -1 }); 
     const payment = await Payment.find().sort({ _id: -1 });
  // const userName = "Arsh Khan"; // Example user
  // const latestStatus = "Pending"; // Example status
  res.render("index", {payuser,payment});
});

app.post("/submit", upload.single("proof"), async (req, res) => {
  try {
    const { name, paymentId, userId } = req.body;
    const result = await cloudinary.v2.uploader.upload(req.file.path);

     // ✅ Update User status to Done
    await Users.findByIdAndUpdate(userId, { status: "Under Review"});

    const newPayment = await Payment.create({
      userName: name,
      paymentId,
      proofUrl: result.secure_url,
      status:"Under Review"
    });

  //     const { id } = req.params;
  // await Users.findByIdAndUpdate(pa, { status: "Done" });
    
     res.render("success", { payment: newPayment });

    //res.json({ success: true, userId, payment: newPayment });
  } catch (err) {
    console.log(err);
    res.send("Error uploading");
  }
});

// ✅ ADMIN LOGIN PAGE
app.get("/admin", (req, res) => {
  res.render("login", { error: null });
});

// ✅ HANDLE ADMIN LOGIN
app.post("/admin", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASS) {
    res.redirect("/dashboard");
  } else {
    res.render("login", { error: "Invalid Password" });
  }
});

// ✅ DASHBOARD
app.get("/dashboard", async (req, res) => {
  const payments = await Payment.find().sort({ _id: -1 });
  res.render("admin", { payments });
});

// ✅ UPDATE STATUS
app.post("/update-status/:id", async (req, res) => {
  const { id } = req.params;
  await Payment.findByIdAndUpdate(id, { status: "Done" });
  res.redirect("/dashboard");
});

app.post("/add-user", async (req, res) => {
  try {
    const { name, amount } = req.body;

    // Validate input
    if (!name || !amount) {
      return res.status(400).send("Name and Amount are required");
    }

    // Create new user
    const newUser = await Users.create({
      name,
      amount,
      status: "Pending"
    });

    console.log("✅ New User Added:", newUser);

    // Redirect back to dashboard after adding
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send("Internal Server Error");
  }
});



// ✅ DELETE ENTRY
app.post("/delete/:id", async (req, res) => {
  const { id } = req.params;
  await Payment.findByIdAndDelete(id);
  res.redirect("/dashboard");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));



// import express from "express";
// import path from "path";
// import mongoose from "mongoose";
// import multer from "multer";
// import dotenv from "dotenv";
// import cloudinary from "cloudinary";
//  import Payment from "./models/payment.js";
// //const Payment = require("./models/payment");

// dotenv.config();
// const app = express();

// // Middleware
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(process.cwd(), "public")));
// app.set("view engine", "ejs");

// // MongoDB Connect
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.log(err));

// // Cloudinary Config
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUD_API_KEY,
//   api_secret: process.env.CLOUD_API_SECRET,
// });

// // Multer Storage
// const storage = multer.diskStorage({
//   destination: "./uploads",
//   filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
// });
// const upload = multer({ storage });

// // ✅ USER PAGE
// app.get("/", async (req, res) => {
// //  const payments = await Payment.find().sort({ _id: -1 });
//   const userName = "Arsh Khan"; // Example user
//   const latestStatus = payments.length > 0 ? payments[0].status : "Pending";
//   res.render("index", { userName, latestStatus});
// });

// // ✅ SUBMIT PAYMENT
// app.post("/submit", upload.single("proof"), async (req, res) => {
//   try {
//     const { name, paymentId } = req.body;
//     const result = await cloudinary.v2.uploader.upload(req.file.path);

//     const newPayment = await Payment.create({
//       userName: name,
//       paymentId,
//       proofUrl: result.secure_url,
//     });

//     res.render("success", { payment: newPayment });
//   } catch (err) {
//     console.log(err);
//     res.send("Error uploading");
//   }
// });

// // ✅ ADMIN LOGIN PAGE
// app.get("/admin", (req, res) => {
//   res.render("login", { error: null });
// });

// // ✅ HANDLE ADMIN LOGIN
// app.post("/admin", (req, res) => {
//   const { password } = req.body;
//   if (password === process.env.ADMIN_PASS) {
//     res.redirect("/dashboard");
//   } else {
//     res.render("login", { error: "Invalid Password" });
//   }
// });

// // ✅ DASHBOARD
// app.get("/dashboard", async (req, res) => {
//   const payments = await Payment.find().sort({ _id: -1 });
//   res.render("admin", { payments });
// });

// // ✅ UPDATE STATUS
// app.post("/update-status/:id", async (req, res) => {
//   const { id } = req.params;
//   await Payment.findByIdAndUpdate(id, { status: "Done" });
//   res.redirect("/dashboard");
// });

// // ✅ DELETE ENTRY
// app.post("/delete/:id", async (req, res) => {
//   const { id } = req.params;
//   await Payment.findByIdAndDelete(id);
//   res.redirect("/dashboard");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
