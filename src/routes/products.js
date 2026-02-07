const express = require("express");
const router = express.Router();

const { User, Product } = require("../models");
const { authJWT, requireRole } = require("../middleware");
const { sendEmail } = require('../mailer');

// GET /api/products?search=&category=&minPrice=&maxPrice=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const filter = {};

    if (category) filter.category = category;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// ADMIN: POST /api/products
router.post("/", authJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const created = await Product.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// ADMIN: PUT /api/products/:id
router.put("/:id", authJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const old = await Product.findById(req.params.id)
    if (!old) return res.status(404).json({ message: "Product not found" });

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const users = await User.find({ wishlist: req.params.id })

    if (updated.price < old.price) {
      for (const user of users) {
        try {
          await sendEmail(
            user.email,
            'Product discount!',
            `<h3>We have great news, ${user.username}!</h3>
          <p>The ${updated.title} you added to your wishlist is on sale right now.</p><br>
          <p>Open <a href="https://glowcare-final.onrender.com">glowcare.com</a> to see more!</p>
          <p>Happy shopping!</p><br>
          <p>Best regards,</p>
          <p>GlowCare team.</p>`
          );
        } catch (err) {
          console.error('Email failed', err.message);
        }
      }
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ADMIN: DELETE /api/products/:id
router.delete("/:id", authJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;