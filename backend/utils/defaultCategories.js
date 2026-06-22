const Category = require("../models/category");

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Investment", type: "income" },
  { name: "Opening Balance", type: "income" },
  { name: "Other Income", type: "income" },
  { name: "Food", type: "expense" },
  { name: "Rent", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Bills", type: "expense" },
  { name: "Entertainment", type: "expense" },
  { name: "Healthcare", type: "expense" },
  { name: "Other Expense", type: "expense" },
];

async function ensureDefaultCategories(userId) {
  const existingCount = await Category.countDocuments({ userId });
  if (existingCount > 0) return;

  await Category.insertMany(
    DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      userId,
      isDefault: true,
    }))
  );
}

module.exports = { ensureDefaultCategories, DEFAULT_CATEGORIES };
