import mongoose from "mongoose";

/**
 * Amount is stored as an integer in minor units (e.g. cents).
 * The client sends/receives in major units; conversion happens in the
 * service layer (multiply on input, divide on output).
 *
 * currencyCode defaults to the user's defaultCurrency at the service layer.
 *
 * Indexes:
 *   { userId: 1, date: -1 }              — list sorted by date
 *   { userId: 1, categoryId: 1, date: -1 } — filtered by category
 *
 * Sharding note (future): shard key would be { userId: "hashed" } once
 * the collection exceeds ~1M documents. userId cardinality is sufficient
 * for even distribution.
 */
const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    icon: {
      type: String,
      default: "",
      trim: true,
      maxlength: [10, "Icon cannot exceed 10 characters"],
    },
    source: {
      type: String,
      required: [true, "Income source is required"],
      trim: true,
      maxlength: [100, "Income source cannot exceed 100 characters"],
    },
    // Integer minor units (cents). Never floating-point.
    amount: {
      type: Number,
      required: [true, "Income amount is required"],
      min: [1, "Income amount must be at least 1 minor unit"],
      validate: {
        validator: Number.isInteger,
        message: "Amount must be an integer (minor units / cents)",
      },
    },
    currencyCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 3,
      default: "USD",
    },
    date: {
      type: Date,
      required: [true, "Income date is required"],
      default: Date.now,
    },
  },
  { timestamps: true }
);

incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ userId: 1, categoryId: 1, date: -1 });

const Income = mongoose.model("Income", incomeSchema);
export default Income;
