import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    icon: {
      type: String,
      default: "",
      trim: true,
    },

    source: {
      type: String,
      required: [true, "Income source is required"],
      trim: true,
      maxlength: [100, "Income source cannot exceed 100 characters"],
    },

    amount: {
      type: Number,
      required: [true, "Income amount is required"],
      min: [0.01, "Income amount must be greater than zero"],
    },

    date: {
      type: Date,
      required: [true, "Income date is required"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Income = mongoose.model("Income", incomeSchema);

export default Income;
