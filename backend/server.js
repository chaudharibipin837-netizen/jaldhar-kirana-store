const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const Product = require("./models/product");
const Order = require("./models/order");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ===============================
// UPLOADS FOLDER
// ===============================

const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

app.use("/uploads", express.static(uploadFolder));

// ===============================
// MULTER STORAGE
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Jaldhar Kirana Store Backend is running!",
  });
});

// ===============================
// IMAGE UPLOAD
// ===============================

app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image select nahi ki gayi",
      });
    }

    const imageUrl =
      `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: "Image uploaded successfully!",
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error("Image upload error:", error);

    res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error.message,
    });
  }
});

// ===============================
// ADD PRODUCT
// ===============================

app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      image,
      description,
      stock,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category and price are required",
      });
    }

    const product = new Product({
      name,
      category,
      price,
      image: image || "",
      description: description || "",
      stock: stock || 0,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
});

// ===============================
// GET ALL PRODUCTS
// ===============================

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// ===============================
// UPDATE PRODUCT
// ===============================

app.put("/api/products/:id", async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      image,
      description,
      stock,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category and price are required",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price,
        image: image || "",
        description: description || "",
        stock: stock || 0,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully!",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
});

// ===============================
// DELETE PRODUCT
// ===============================

app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully!",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

// ===============================
// CREATE ORDER + AUTO STOCK REDUCTION
// ===============================

app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
      items,
      totalAmount,
      paymentMethod,
    } = req.body;

    // ===============================
    // PAYMENT METHOD CHECK
    // ===============================

    const selectedPaymentMethod = paymentMethod || "COD";

    if (!["COD", "UPI"].includes(selectedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // ===============================
    // BASIC ORDER VALIDATION
    // ===============================

    if (
      !customerName ||
      !phone ||
      !address ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      totalAmount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer details and cart items are required",
      });
    }

    // ===============================
    // STOCK CHECK
    // ===============================

    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID missing in order",
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${item.name || "product"}`,
        });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `${item.name || "Product"} product nahi mila`,
        });
      }

      if (product.stock <= 0) {
        return res.status(400).json({
          success: false,
          message: `${product.name} Out of Stock hai`,
        });
      }

      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `${product.name} ka sirf ${product.stock} stock available hai`,
        });
      }
    }

    // ===============================
    // STOCK REDUCE
    // ===============================

    for (const item of items) {
      const quantity = Number(item.quantity);

      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            stock: -quantity,
          },
        },
        {
          new: true,
        }
      );
    }

    // ===============================
    // CREATE ORDER
    // ===============================

    const order = new Order({
      customerName,
      phone,
      address,
      items,
      totalAmount,
      paymentMethod: selectedPaymentMethod,
      status: "Pending",
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
});

// ===============================
// GET ALL ORDERS
// ===============================

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

// ===============================
// GET SINGLE ORDER
// ===============================

app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get single order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
});

// ===============================
// UPDATE ORDER STATUS
// ===============================

app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully!",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
});

// ===============================
// DELETE ORDER
// ===============================

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order deleted successfully!",
    });
  } catch (error) {
    console.error("Delete order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
});

// ===============================
// DATABASE CONNECTION
// ===============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(
        `Server running at http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error.message);
  });