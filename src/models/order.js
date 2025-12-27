import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required in order item"],
  },
  title: {
    type: String,
    required: [true, "Product title is required"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  subtotal: {
    type: Number,
    default: function () {
      return this.price * this.quantity;
    },
  },
});

const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: "US" },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required for order"],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    total: {
      type: Number,
      required: [true, "Order total is required"],
      min: [0, "Total cannot be negative"],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded",
        ],
        message: "Invalid order status",
      },
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "paypal",
        "bank_transfer",
        "cash_on_delivery",
      ],
      required: true,
    },
    shippingAddress: shippingAddressSchema,
    billingAddress: shippingAddressSchema,
    trackingNumber: String,
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    orderNumber: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

// Pre-save middleware to generate order number and calculate totals
orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    // Generate order number: ORD + timestamp + random 4 digits
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.orderNumber = `ORD${timestamp}${random}`;
  }

  // Calculate subtotal
  this.subtotal = this.items.reduce((total, item) => total + item.subtotal, 0);

  // Calculate total (subtotal + tax + shipping - discount)
  this.total = this.subtotal + this.tax + this.shipping - this.discount;

  next();
});

// Virtual for order age
orderSchema.virtual("orderAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to update order status
orderSchema.methods.updateStatus = function (newStatus) {
  const validStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];
  if (validStatuses.includes(newStatus)) {
    this.status = newStatus;
    return this.save();
  }
  throw new Error("Invalid order status");
};

// Method to calculate total weight (if products have weight)
orderSchema.methods.getTotalWeight = async function () {
  const Product = mongoose.model("Product");
  let totalWeight = 0;

  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product && product.weight) {
      totalWeight += product.weight * item.quantity;
    }
  }

  return totalWeight;
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function (status) {
  return this.find({ status })
    .populate("user", "name email")
    .sort({ createdAt: -1 });
};

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

export default mongoose.model("Order", orderSchema);
