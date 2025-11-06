// server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;     // <-- replace with your key id
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET; // <-- replace with your key secret

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const app = express();
const port =  process.env.PORT || 2005;
const serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ─────────────────────────────────────────────────────────────────────────────
// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ─────────────────────────────────────────────────────────────────────────────
// Health
app.get("/", (_req, res) => res.send("🚀 Express App is Running"));

// ─────────────────────────────────────────────────────────────────────────────
// Uploads
// ─────────────────────────────────────────────────────────────────────────────
// CLOUDINARY UPLOADS
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Cloudinary for storage
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) => uuidv4(),
  },
});

const upload = multer({ storage: cloudStorage });

// Upload endpoint
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: 0, message: "No file uploaded" });
  res.json({ success: 1, image_url: req.file.path }); // Cloudinary gives a full URL
});

// Keep serving old images
app.use("/images", express.static("upload/images"));

// ─────────────────────────────────────────────────────────────────────────────
// Models
const Product = mongoose.model("Product", {
  id: { type: Number, unique: true },
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  // optional gallery support
  images: { type: [String], default: [] },

  category: { type: String, required: true },
  new_price: { type: Number, required: true, min: 0 },
  old_price: { type: Number, required: true, min: 0 },

  // NEW fields
  brand: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  tags: { type: [String], default: [] },
  sizes: { type: [String], default: ["S", "M", "L", "XL"] },
  stock: { type: Number, default: 10, min: 0 },

  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

const User = mongoose.model("User", {
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true }, // (plain for now)
  cartData: { type: Object, default: {} }, // { [productId]: quantity }
  date: { type: Date, default: Date.now },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
const nextProductId = async () => {
  const last = await Product.findOne({}, {}, { sort: { id: -1 } });
  return last ? last.id + 1 : 1;
};

// Parse arrays safely if client sent comma-separated strings
const asStringArray = (v) =>
  Array.isArray(v) ? v : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

// ─────────────────────────────────────────────────────────────────────────────
// Products
app.post("/addproduct", async (req, res) => {
  try {
    const id = await nextProductId();

    const product = new Product({
      id,
      name: req.body.name,
      image: req.body.image,
      images: req.body.images || [],
      category: req.body.category,
      brand: req.body.brand || "Generic",
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      description: req.body.description || "",
      tags: asStringArray(req.body.tags),
      sizes: asStringArray(req.body.sizes).length ? asStringArray(req.body.sizes) : ["S", "M", "L", "XL"],
      stock: typeof req.body.stock === "number" ? req.body.stock : Number(req.body.stock) || 10,
      available: req.body.available ?? true,
    });

    await product.save();
    console.log("✅ Product Saved:", product.name);
    res.json({ success: true, product });
  } catch (err) {
    console.error("❌ Error saving product:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE by Mongo _id
app.delete("/removeproduct/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    console.log("✅ Product removed:", product.name);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error("❌ Error removing product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// All products
app.get("/allproducts", async (_req, res) => {
  try {
    const products = await Product.find({});
    res.send(products);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

// Get one product by numeric id (not _id)
app.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update product by Mongo _id (now supports new fields)
app.put("/updateproduct/:id", async (req, res) => {
  try {
    const doc = {
      name: req.body.name,
      image: req.body.image,
      images: req.body.images,
      category: req.body.category,
      brand: req.body.brand,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      description: req.body.description,
      tags: req.body.tags ? asStringArray(req.body.tags) : undefined,
      sizes: req.body.sizes ? asStringArray(req.body.sizes) : undefined,
      stock: req.body.stock,
      available: req.body.available,
    };

    const product = await Product.findByIdAndUpdate(req.params.id, doc, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    console.log("✅ Product updated:", product.name);
    res.json({ success: true, product });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// New collections (last 8)
app.get("/newcollections", async (_req, res) => {
  try {
    const products = await Product.find().sort({ date: 1 });
    res.json(products.slice(-8));
  } catch (err) {
    console.error("Error fetching new collections:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Popular categories
app.get("/popularinwomen", async (_req, res) => {
  try {
    const products = await Product.find({ category: "women" }).limit(4);
    res.send(products);
  } catch {
    res.status(500).send("Error fetching popular in women");
  }
});

app.get("/popularinmen", async (_req, res) => {
  try {
    const products = await Product.find({ category: "men" }).limit(4);
    res.send(products);
  } catch {
    res.status(500).send("Error fetching popular in men");
  }
});

app.get("/popularinkids", async (_req, res) => {
  try {
    const products = await Product.find({ category: "kids" }).limit(4);
    res.send(products);
  } catch {
    res.status(500).send("Error fetching popular in kids");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth + Users
const fetchUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).send({ error: "No token" });
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.user;
    next();
  } catch {
    res.status(401).send({ error: "Invalid token" });
  }
};

app.post("/signup", async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ success: false, message: "User already exists" });

    const cart = {};
    for (let i = 0; i < 300; i++) cart[i] = 0;

    const user = new User({
      name: req.body.username,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    });
    await user.save();

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, errors: "Wrong Email Id" });
    if (user.password !== password)
      return res.status(400).json({ success: false, errors: "Wrong Password" });

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/getuser", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});
// Update user
app.put("/updateuser", fetchUser, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Cart
app.post("/getcart", fetchUser, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.cartData || {});
});

/**
 * Legacy full-cart update (kept for backwards compatibility).
 * Does NOT touch stock.
 */
app.post("/updatecart", fetchUser, async (req, res) => {
  try {
    const { cart } = req.body;
    await User.findByIdAndUpdate(req.user.id, { cartData: cart });
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
});

/**
 * NEW precise cart actions that also adjust product stock.
 * Use these from the frontend for add/remove buttons.
 */
app.post("/cart/add", fetchUser, async (req, res) => {
  try {
    const { productId } = req.body; // numeric product.id
    const product = await Product.findOne({ id: Number(productId) });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.stock <= 0) return res.status(400).json({ success: false, message: "Out of stock" });

    const user = await User.findById(req.user.id);
    const cart = user.cartData || {};
    cart[productId] = (cart[productId] || 0) + 1;

    product.stock -= 1;
    await Promise.all([user.updateOne({ cartData: cart }), product.save()]);

    res.json({ success: true, cart, stock: product.stock });
  } catch (err) {
    console.error("❌ /cart/add error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/cart/remove", fetchUser, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findOne({ id: Number(productId) });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const user = await User.findById(req.user.id);
    const cart = user.cartData || {};
    const currentQty = cart[productId] || 0;
    if (currentQty <= 0) return res.json({ success: true, cart, stock: product.stock });

    cart[productId] = currentQty - 1;
    product.stock += 1;
    await Promise.all([user.updateOne({ cartData: cart }), product.save()]);

    res.json({ success: true, cart, stock: product.stock });
  } catch (err) {
    console.error("❌ /cart/remove error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Newsletter Model
const Newsletter = mongoose.model("Newsletter", {
  email: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
});

// Add newsletter subscription
app.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // Check if already subscribed
    const exists = await Newsletter.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email already subscribed" });

    const subscription = new Newsletter({ email });
    await subscription.save();

    res.json({ success: true, message: "Subscribed successfully!" });
  } catch (err) {
    console.error("Newsletter Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/newsletter/subscribers", async (_req, res) => {
  try {
    const subscribers = await Newsletter.find().select("email -_id"); // only emails
    res.json({ success: true, subscribers });
  } catch (err) {
    console.error("Error fetching subscribers:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.post("/newsletter/send", async (req, res) => {
  try {
    const { subject, content } = req.body;
    if (!subject || !content) {
      return res.status(400).json({ success: false, message: "Subject & content required" });
    }

    const subscribers = await Newsletter.find().select("email -_id");
    const emails = subscribers.map((sub) => sub.email);

    if (!emails.length) {
      return res.json({ success: false, message: "No subscribers to send" });
    }

    // Configure transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,     // <-- change this
        pass: process.env.EMAIL_PASS,    // <-- app password from Google
      },
    });

    let mailOptions = {
      from: '"Your Brand" <your-real-gmail@gmail.com>',
      to: emails.join(","), // convert array to string
      subject,
      html: `<div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6;">
               <h2>${subject}</h2>
               <p>${content}</p>
             </div>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "✅ Newsletter sent successfully!" });
  } catch (err) {
    console.error("Send newsletter error:", err);
    res.status(500).json({ success: false, message: "❌ Failed to send newsletter", error: err.message });
  }
});

//prome code 
const Promo = mongoose.model("Promo", {
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true, min: 0, max: 100 }, // percentage
  active: { type: Boolean, default: true },
  expiry: { type: Date, default: null }, // optional expiry
  createdAt: { type: Date, default: Date.now },
});

app.post("/apply-promo", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: "Promo code required" });

    const promo = await Promo.findOne({ code: code.trim().toUpperCase(), active: true });
    if (!promo) return res.status(404).json({ valid: false, message: "Invalid promo code" });

    if (promo.expiry && promo.expiry < new Date())
      return res.status(400).json({ valid: false, message: "Promo code expired" });

    res.json({ valid: true, discount: promo.discount });
  } catch (err) {
    console.error("❌ Apply promo error:", err);
    res.status(500).json({ valid: false, message: "Server error" });
  }
});

app.post("/create-promo", async (req, res) => {
  try {
    const { code, discount, expiry } = req.body;
    if (!code || typeof discount !== "number") return res.status(400).json({ success: false, message: "Invalid input" });

    const promo = new Promo({
      code: code.trim().toUpperCase(),
      discount,
      expiry: expiry ? new Date(expiry) : null,
    });

    await promo.save();
    res.json({ success: true, promo });
  } catch (err) {
    console.error("❌ Create promo error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/get-promos", async (req, res) => {
  try {
    const promos = await Promo.find({ active: true })
      .sort({ createdAt: -1 }) // newest first
      .limit(3); // only 3 promos

    res.json(promos);
  } catch (err) {
    console.error("❌ Get promos error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Address Model
// ─────────────────────────────────────────────────────────────────────────────
const AddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const Address = mongoose.model("Address", AddressSchema);

// ────────────────────────────────────────────────
app.post("/address/add", fetchUser, async (req, res) => {
  try {
    const { name, phone, street, city, state, pincode, country, isDefault } = req.body;
    if (!name || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const userId = req.user.id;

    // If user has no addresses yet, force the first one to be default
    const existingCount = await Address.countDocuments({ userId });

    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const address = new Address({
      userId,
      name,
      phone,
      street,
      city,
      state,
      pincode,
      country: country || "India",
      isDefault: existingCount === 0 ? true : !!isDefault,
    });

    await address.save();
    res.json({ success: true, address });
  } catch (err) {
    console.error("❌ Add Address Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update an existing address
app.put("/address/update/:id", fetchUser, async (req, res) => {
  try {
    const { name, phone, street, city, state, pincode, country, isDefault } = req.body;
    if (!name || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const userId = req.user.id;
    const addressId = req.params.id;

    if (isDefault) {
      // Unset default for all other addresses
      await Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
    }

    const updated = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      {
        name,
        phone,
        street,
        city,
        state,
        pincode,
        country: country || "India",
        isDefault: !!isDefault,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Address not found" });

    // Safety: if no default remains (user unchecked it), ensure at least one default exists
    const anyDefault = await Address.exists({ userId, isDefault: true });
    if (!anyDefault) {
      // make the updated one default again (or choose most recent)
      await Address.updateOne({ _id: updated._id }, { isDefault: true });
      updated.isDefault = true;
    }

    res.json({ success: true, address: updated });
  } catch (err) {
    console.error("❌ Update Address Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all addresses
app.get("/address/list", fetchUser, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json({ success: true, addresses });
  } catch (err) {
    console.error("❌ Get Addresses Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete an address (if default, promote another)
app.delete("/address/delete/:id", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const toDelete = await Address.findOneAndDelete({ _id: req.params.id, userId });

    if (!toDelete) return res.status(404).json({ success: false, message: "Address not found" });

    if (toDelete.isDefault) {
      // promote the most recent remaining address to default (if exists)
      const newest = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (newest) {
        await Address.updateOne({ _id: newest._id }, { isDefault: true });
      }
    }

    res.json({ success: true, message: "Address deleted" });
  } catch (err) {
    console.error("❌ Delete Address Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Set default address explicitly
app.put("/address/default/:id", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    await Address.updateMany({ userId }, { isDefault: false });
    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isDefault: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Address not found" });
    res.json({ success: true, message: "Default address set", address: updated });
  } catch (err) {
    console.error("❌ Set Default Address Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
//_______________________________________________________________________
const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },
    cartItems: [
      {
        id: Number,
        name: String,
        price: Number,      // INR per unit at order time
        quantity: Number,
        image: String,
      },
    ],
    total: { type: Number, required: true },   // INR (rupees)
    currency: { type: String, default: "INR" },

    // Razorpay fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    status: {
      type: String,
      enum: ["Created", "Paid", "Failed", "Shipped", "Delivered", "Cancelled"],
      default: "Created",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

// Create Razorpay order (amount in INR rupees)
app.post("/payment/create-order", fetchUser, async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR (rupees)
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amountNum * 100), // convert rupees -> paise
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      notes: { userId: req.user.id },
    };

    const order = await razorpay.orders.create(options);
    // return both order & key (frontend needs key id)
    res.json({ success: true, order, key: RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("❌ /payment/create-order error:", err);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
});

app.post("/payment/verify-and-save", fetchUser, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      address,
      cartItems,
      total,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Signature verification failed" });
    }

    // Validate total
    const totalNum = Number(total) || 0;
    if (totalNum <= 0) return res.status(400).json({ success: false, message: "Invalid total" });

    // Save order in DB
    const orderDoc = await Order.create({
      userId: req.user.id,
      address: {
        name: address?.name,
        phone: address?.phone,
        street: address?.street,
        city: address?.city,
        state: address?.state,
        pincode: address?.pincode,
        country: address?.country || "India",
      },
      cartItems: Array.isArray(cartItems)
        ? cartItems.map((it) => ({
            id: Number(it.id),
            name: String(it.name || ""),
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 0,
            image: it.image || "",
          }))
        : [],
      total: totalNum,
      currency: "INR",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "Paid",
    });
    // Clear purchased items from the user's cart server-side
await User.findByIdAndUpdate(req.user.id, { $set: { cartData: {} } });

    return res.json({ success: true, order: orderDoc });
  } catch (err) {
    console.error("❌ /payment/verify-and-save error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/order/:id", fetchUser, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Get order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/orders/me", fetchUser, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ Get my orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all orders (Admin)
app.get("/orders/all", async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ Get all orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update order status (Admin)
app.put("/orders/update-status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Update order status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//___________________________________________________________________________
// Review Model
const Review = mongoose.model("Review", {
  productId: { type: Number, required: true }, // numeric product id
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true }, // user's name
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

app.post("/product/:id/review", fetchUser, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: "Rating must be 1-5" });

    const product = await Product.findOne({ id: productId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const user = await User.findById(req.user.id);

    const review = new Review({
      productId,
      userId: user._id,
      name: user.name,
      rating,
      comment,
    });

    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    console.error("❌ Add review error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Get reviews for a product
app.get("/product/:id/reviews", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    console.error("❌ Get reviews error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/product/:id/average-rating", async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const reviews = await Review.find({ productId });

    if (!reviews.length) return res.json({ success: true, average: 0 });

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    res.json({ success: true, average: avg.toFixed(1), totalReviews: reviews.length });
  } catch (err) {
    console.error("❌ Average rating error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Notification = mongoose.model("Notification", notificationSchema);


const userNotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notificationId: { type: mongoose.Schema.Types.ObjectId, ref: "Notification", required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const UserNotification = mongoose.model("UserNotification", userNotificationSchema);

// Create and send notification to all users
// GET Notifications (no login required)
app.get("/api/admin/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// POST Send Notification to all users (no login required)
app.post("/api/admin/notifications", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    // Prevent spam duplicate messages within 3 seconds
    const last = await Notification.findOne().sort({ createdAt: -1 });
    if (last && Date.now() - new Date(last.createdAt).getTime() < 3000) {
      return res.status(400).json({ error: "Duplicate notification prevented" });
    }

    const notification = new Notification({ message });
    await notification.save();

    const users = await User.find();
    const userNotifs = users.map((u) => ({
      userId: u._id,
      notificationId: notification._id,
    }));
    await UserNotification.insertMany(userNotifs);

    res.json(notification);
  } catch (err) {
    console.error("⚠ Notification Error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});


// =============================================
// 👤 USER NOTIFICATION ROUTES
// =============================================

// Get user's notifications
app.get("/api/notifications/:userId", fetchUser, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const userNotifications = await UserNotification.find({ userId })
      .populate("notificationId", "message createdAt")
      .sort({ createdAt: -1 });

    const formatted = userNotifications.map((n) => ({
      id: n._id,
      message: n.notificationId.message,
      createdAt: n.notificationId.createdAt,
      isRead: n.isRead,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark all user notifications as read
// PUT /api/notifications/usernotification/:userNotifId/read
app.put("/api/notifications/usernotification/:userNotifId/read", fetchUser, async (req, res) => {
  try {
    const { userNotifId } = req.params;
    // ensure the UserNotification belongs to the logged-in user
    const userNotif = await UserNotification.findById(userNotifId);
    if (!userNotif) return res.status(404).json({ error: "Not found" });
    if (userNotif.userId.toString() !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    // Only update if it is unread
    if (!userNotif.isRead) {
      userNotif.isRead = true;
      await userNotif.save();
    }

    res.json({ message: "Notification marked read", id: userNotifId });
  } catch (err) {
    console.error("Error marking single notification read:", err);
    res.status(500).json({ error: "Failed to update" });
  }
});
// PUT /api/notifications/:userId/read
app.put("/api/notifications/:userId/read", fetchUser, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) return res.status(403).json({ error: "Unauthorized" });

    const result = await UserNotification.updateMany(
      { userId, isRead: false },      // only unread
      { $set: { isRead: true } }
    );
    // result.modifiedCount (or result.nModified depending on driver)
    res.json({ message: "All notifications marked as read", modifiedCount: result.modifiedCount ?? result.nModified });
  } catch (err) {
    console.error("Error marking all read:", err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

//___________________________________________________________________________
// Start
app.listen(port, (error) => {
  if (!error) console.log("✅ Server Running on Port " + port);
  else console.log("❌ Error: " + error);
});
