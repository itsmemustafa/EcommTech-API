import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    image: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Image URL must be a valid HTTP/HTTPS URL",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for full path (breadcrumb)
categorySchema.virtual("fullPath").get(async function () {
  const path = [this.name];
  let current = this;

  while (current.parent) {
    current = await mongoose.model("Category").findById(current.parent);
    if (current) path.unshift(current.name);
  }

  return path.join(" > ");
});

// Prevent circular references
categorySchema.pre("save", async function (next) {
  if (this.parent && this.parent.equals(this._id)) {
    return next(new Error("Category cannot be its own parent"));
  }

  // Check for circular reference
  if (this.parent) {
    const visited = new Set([this._id.toString()]);
    let current = this.parent;

    while (current) {
      if (visited.has(current.toString())) {
        return next(
          new Error("Circular reference detected in category hierarchy")
        );
      }
      visited.add(current.toString());

      const parentCategory = await mongoose.model("Category").findById(current);
      current = parentCategory?.parent;
    }
  }

  next();
});

categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });

export default mongoose.model("Category", categorySchema);
