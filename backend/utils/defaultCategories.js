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

const categoryKey = (type, name) =>
  `${String(type).toLowerCase()}::${String(name).trim().toLowerCase()}`;

async function ensureDefaultCategories(userId) {
  const existing = await Category.find({ userId }).select("name type").lean();
  const existingKeys = new Set(
    existing.map((category) => categoryKey(category.type, category.name))
  );

  const missing = DEFAULT_CATEGORIES.filter(
    (category) => !existingKeys.has(categoryKey(category.type, category.name))
  );

  if (missing.length === 0) return;

  await Category.insertMany(
    missing.map((category) => ({
      ...category,
      userId,
      isDefault: true,
    }))
  );
}

module.exports = { ensureDefaultCategories, DEFAULT_CATEGORIES };
