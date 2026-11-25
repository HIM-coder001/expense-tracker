import mongoose from "mongoose";

/**
 * Categories are either:
 *   - System defaults: userId is null, visible to all users
 *   - User-created:    userId is set, visible only to that user
 *
 * Unique index: (userId, name) with collation for case-insensitive names.
 * For system defaults userId is null, so two system categories with the
 * same name are still blocked by the unique index.
 */
const CategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = system-wide default
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [10, "Icon cannot exceed 10 characters"],
      default: "📦",
    },
    type: {
      type: String,
      enum: ["income", "expense", "both"],
      default: "both",
    },
  },
  { timestamps: true }
);

// Case-insensitive unique name per user (null userId treated as one "user")
CategorySchema.index(
  { userId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

const Category = mongoose.model("Category", CategorySchema);
export default Category;
