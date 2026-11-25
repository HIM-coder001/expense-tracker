import mongoose from "mongoose";

/**
 * Mirror of Income with the addition of a category reference.
 * Amount in integer minor units. Same sharding plan as Income.
 *
 * Future extensibility:
 *   - budgetId reference: add { budgetId: ObjectId, default: null } here
 *   - recurringRuleId: add { recurringRuleId: ObjectId, default: null }
 *   No migration needed — these fields simply won't exist on old docs
 *   until populated, and Mongoose treats missing optional refs as null.
 */
const expenseSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [100, "Expense title cannot exceed 100 characters"],
    },
    // Integer minor units (cents). Never floating-point.
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [1, "Expense amount must be at least 1 minor unit"],
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
      required: [true, "Expense date is required"],
      default: Date.now,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1, date: -1 });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
