import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required in cart item"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
    max: [99, "Quantity cannot exceed 99"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required for cart"],
      unique: true,
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ "items.product": 1 });

// Virtual for cart item count
cartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total price calculation
cartSchema.virtual("calculatedTotal").get(function () {
  return this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
});

// Pre-save middleware to update totals
cartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  this.totalPrice = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  this.lastModified = new Date();
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function (productId, quantity, price) {
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // Update price in case it changed
  } else {
    this.items.push({ product: productId, quantity, price });
  }
};

// Method to remove item from cart
cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
};

// Method to update item quantity
cartSchema.methods.updateQuantity = function (productId, quantity) {
  const item = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (item) {
    if (quantity <= 0) {
      this.removeItem(productId);
    } else {
      item.quantity = quantity;
    }
  }
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.totalItems = 0;
  this.totalPrice = 0;
};

cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

export default mongoose.model("Cart", cartSchema);
