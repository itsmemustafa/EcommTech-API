
//later will be used to manage inventory levels, track stock changes, and generate reports



import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required for inventory log"],
    },
    change: {
      type: Number,
      required: [true, "Stock change amount is required"],
    },
    reason: {
      type: String,
      enum: {
        values: [
          "sale",
          "return",
          "restock",
          "adjustment",
          "initial",
          "damaged",
          "expired",
        ],
        message: "Invalid inventory change reason",
      },
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      trim: true,
    }, // Order ID, supplier invoice, etc.
    notes: {
      type: String,
      maxlength: [200, "Notes cannot exceed 200 characters"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User who performed the change is required"],
    },
  },
  { timestamps: true }
);

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required for inventory"],
      unique: true,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, "Current stock cannot be negative"],
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, "Reserved stock cannot be negative"],
    },
    availableStock: {
      type: Number,
      default: function () {
        return Math.max(0, this.currentStock - this.reservedStock);
      },
    },
    minStockLevel: {
      type: Number,
      default: 5,
      min: [0, "Minimum stock level cannot be negative"],
    },
    maxStockLevel: {
      type: Number,
      min: [0, "Maximum stock level cannot be negative"],
    },
    reorderPoint: {
      type: Number,
      default: function () {
        return this.minStockLevel;
      },
      min: [0, "Reorder point cannot be negative"],
    },
    location: {
      warehouse: String,
      aisle: String,
      shelf: String,
      bin: String,
    },
    supplier: {
      name: String,
      contact: String,
      leadTime: Number, // days
    },
    lastRestocked: Date,
    lastCounted: Date,
    logs: [inventoryLogSchema],
  },
  { timestamps: true }
);

// Indexes
inventorySchema.index({ product: 1 });
inventorySchema.index({ currentStock: 1 });
inventorySchema.index({ availableStock: 1 });
inventorySchema.index({ "location.warehouse": 1 });

// Virtual for stock status
inventorySchema.virtual("stockStatus").get(function () {
  if (this.availableStock === 0) return "out-of-stock";
  if (this.availableStock <= this.minStockLevel) return "low-stock";
  if (this.availableStock >= this.maxStockLevel) return "overstock";
  return "in-stock";
});

// Virtual for reorder needed
inventorySchema.virtual("needsReorder").get(function () {
  return this.availableStock <= this.reorderPoint;
});

// Pre-save middleware to update available stock
inventorySchema.pre("save", function (next) {
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
  next();
});

// Method to adjust stock
inventorySchema.methods.adjustStock = function (
  change,
  reason,
  performedBy,
  reference = "",
  notes = ""
) {
  const previousStock = this.currentStock;
  this.currentStock += change;

  if (this.currentStock < 0) {
    throw new Error("Stock cannot be negative");
  }

  // Add log entry
  this.logs.push({
    product: this.product,
    change,
    reason,
    previousStock,
    newStock: this.currentStock,
    reference,
    notes,
    performedBy,
  });

  return this.save();
};

// Method to reserve stock
inventorySchema.methods.reserveStock = function (quantity) {
  if (this.availableStock < quantity) {
    throw new Error("Insufficient available stock");
  }
  this.reservedStock += quantity;
  return this.save();
};

// Method to release reserved stock
inventorySchema.methods.releaseStock = function (quantity) {
  this.reservedStock = Math.max(0, this.reservedStock - quantity);
  return this.save();
};

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function () {
  return this.find({
    $expr: { $lte: ["$availableStock", "$minStockLevel"] },
  }).populate("product", "title slug stock");
};

// Static method to get items needing reorder
inventorySchema.statics.getItemsNeedingReorder = function () {
  return this.find({
    $expr: { $lte: ["$availableStock", "$reorderPoint"] },
  }).populate("product", "title slug");
};

inventorySchema.set("toJSON", { virtuals: true });
inventorySchema.set("toObject", { virtuals: true });

export default mongoose.model("Inventory", inventorySchema);
