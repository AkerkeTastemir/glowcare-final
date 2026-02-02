const mongoose = require("mongoose");

// ===== Quiz Profile Schema (embedded) =====
const quizProfileSchema = new mongoose.Schema(
  {
    skinType: { type: String },
    concerns: { type: [String], default: [] },
    preferences: { type: [String], default: [] },
    completedAt: { type: Date },
  },
  { _id: false }
);

// ===== User Schema =====
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "email is necessary"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "please, enter valid email"],
    },
    password: {
      type: String,
      required: [true, "password is necessary"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    username: {
      type: String,
      required: [true, "username is necessary"],
    },
    quizProfile: {
      type: quizProfileSchema,
      default: null,
    },
    wishlist: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// ===== Product Schema =====

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },

    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },

    skinTypes: { type: [String], default: [] },   // ["dry", "sensitive"]
    concerns: { type: [String], default: [] },    // ["redness"]
    qualities: { type: [String], default: [] },   // ["fragrance-free", "vegan"]

    soldCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);


productSchema.index({ title: "text", brand: "text", category: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

// ===== Order Schema =====
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // price snapshot at purchase time
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: { type: [orderItemSchema], required: true, default: [] },

    totalPrice: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// ===== Models =====
const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

module.exports = {
  User,
  Product,
  Order,
};