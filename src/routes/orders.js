const express = require("express");
const router = express.Router();

const { Product, Order } = require("../models");
const { authJWT, requireRole } = require("../middleware");

// POST /api/orders/checkout
// body: { items: [{ productId, quantity }] }
router.post("/checkout", authJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const map = new Map(products.map((p) => [String(p._id), p]));

    let totalPrice = 0;
    const orderItems = [];

    for (const i of items) {
      const p = map.get(String(i.productId));
      if (!p) return res.status(404).json({ message: "Product not found" });

      const qty = Number(i.quantity);
      if (!qty || qty < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (p.stock < qty) {
        return res.status(400).json({ message: `Not enough stock for ${p.title}` });
      }

      totalPrice += p.price * qty;
      orderItems.push({ productId: p._id, quantity: qty, price: p.price });
    }

    // advanced update: decrement stock, increment soldCount
    for (const i of orderItems) {
      const result = await Product.updateOne(
        { _id: i.productId, stock: { $gte: i.quantity } },
        { $inc: { stock: -i.quantity, soldCount: i.quantity } }
      );

      if (result.modifiedCount === 0) {
        return res
          .status(400)
          .json({ message: "Checkout failed (stock changed). Try again." });
      }
    }

    const order = await Order.create({
      userId,
      items: orderItems,
      totalPrice,
      status: "pending",
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my
router.get("/my", authJWT, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// ADMIN: PATCH /api/orders/:id/status
router.patch("/:id/status", authJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "paid", "shipped", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: "Order not found" });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ADMIN: GET /api/orders/stats/top-selling
router.get(
  "/stats/top-selling",
  authJWT,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const limit = Number(req.query.limit || 5);

      const pipeline = [
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 0,
            productId: "$product._id",
            title: "$product.title",
            brand: "$product.brand",
            category: "$product.category",
            totalSold: 1,
            revenue: 1,
          },
        },
      ];

      const result = await Order.aggregate(pipeline);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;