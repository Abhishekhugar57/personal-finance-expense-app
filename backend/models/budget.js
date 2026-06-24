const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    amount: { type: Number, required: true, min: 0 },
    month: { type: String, required: true }, // YYYY-MM
    alertThreshold: { type: Number, default: 80, min: 0, max: 100 },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, month: 1 });

module.exports = mongoose.model("Budget", budgetSchema);
