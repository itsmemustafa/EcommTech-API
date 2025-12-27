import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Image URL must be a valid HTTP/HTTPS URL",
        },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    tags: [{ type: String, trim: true }],
    seoTitle: {
      type: String,
      maxlength: [60, "SEO title cannot exceed 60 characters"],
    },
    seoDescription: {
      type: String,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
  },
  { timestamps: true }
);

// Indexes for better performance
productSchema.index({ title: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ slug: 1 });

// Virtual for stock status
productSchema.virtual("stockStatus").get(function () {
  if (this.stock === 0) return "out-of-stock";
  if (this.stock < 10) return "low-stock";
  return "in-stock";
});

// Ensure virtual fields are serialized
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
