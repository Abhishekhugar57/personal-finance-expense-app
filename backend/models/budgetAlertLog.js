const mongoose = require("mongoose");

const budgetAlertLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    month: { type: String, required: true },
    threshold: { type: Number, required: true },
  },
  { timestamps: true }
);

budgetAlertLogSchema.index(
  { userId: 1, budgetId: 1, month: 1, threshold: 1 },
  { unique: true }
);

module.exports = mongoose.model("BudgetAlertLog", budgetAlertLogSchema);
