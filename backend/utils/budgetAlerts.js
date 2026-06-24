const Budget = require("../models/budget");
const BudgetAlertLog = require("../models/budgetAlertLog");
const Notification = require("../models/notification");
const Transaction = require("../models/transaction");
const User = require("../models/user");
const { sendBudgetAlertEmail } = require("./mailer");

const THRESHOLDS = (process.env.BUDGET_ALERT_THRESHOLDS || "80,90,100")
  .split(",")
  .map((v) => Number(v.trim()))
  .filter((n) => Number.isFinite(n) && n > 0)
  .sort((a, b) => a - b);

function monthKey(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month) {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

async function getCategorySpend(userId, categoryId, month) {
  const { start, end } = monthRange(month);
  const filter = {
    user_id: userId,
    type: "expense",
    transaction_date: { $gte: start, $lt: end },
  };
  if (categoryId) filter.category_id = categoryId;

  const txns = await Transaction.find(filter);
  return txns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

async function processBudgetAlert({ userId, budget, spent, user, categoryName }) {
  if (!budget.amount || budget.amount <= 0) return;

  const percent = (spent / budget.amount) * 100;
  const month = budget.month;

  for (const threshold of THRESHOLDS) {
    if (percent < threshold) continue;

    const exists = await BudgetAlertLog.findOne({
      userId,
      budgetId: budget._id,
      month,
      threshold,
    });
    if (exists) continue;

    const isExceeded = threshold >= 100;
    const type = isExceeded ? "budget_exceeded" : "budget_warning";
    const title = isExceeded
      ? `Budget exceeded: ${categoryName}`
      : `Budget warning: ${categoryName}`;
    const message = `You've used ${percent.toFixed(1)}% of your ${categoryName} budget (₹${spent.toFixed(2)} / ₹${budget.amount.toFixed(2)}).`;

    try {
      await sendBudgetAlertEmail({
        to: user.email,
        userName: user.userName,
        categoryName,
        percent,
        budgetAmount: budget.amount,
        spent,
        threshold,
      });
    } catch (err) {
      console.error("Budget alert email failed:", err.message);
    }

    await Notification.create({
      userId,
      title,
      message,
      type,
      category: budget.categoryId?._id || budget.categoryId || null,
      categoryName,
      link: "/budgets",
      isRead: false,
    });

    await BudgetAlertLog.create({
      userId,
      budgetId: budget._id,
      categoryId: budget.categoryId?._id || budget.categoryId || null,
      month,
      threshold,
    });
  }
}

async function checkBudgetAlerts({
  userId,
  categoryIds = [],
  transactionDate = new Date(),
}) {
  const user = await User.findById(userId).select("email userName");
  if (!user?.email) return;

  const month = monthKey(transactionDate);
  const uniqueCategoryIds = [
    ...new Set(categoryIds.filter(Boolean).map((id) => id.toString())),
  ];

  const budgets = await Budget.find({
    userId,
    month,
    $or: [{ categoryId: null }, { categoryId: { $in: uniqueCategoryIds } }],
  }).populate("categoryId", "name");

  for (const budget of budgets) {
    const categoryName = budget.categoryId?.name || budget.name || "Overall";
    const catId = budget.categoryId?._id || budget.categoryId || null;
    const spent = await getCategorySpend(userId, catId, month);
    await processBudgetAlert({ userId, budget, spent, user, categoryName });
  }
}

async function resetBudgetAlertLogs(budgetId) {
  await BudgetAlertLog.deleteMany({ budgetId });
}

module.exports = { checkBudgetAlerts, resetBudgetAlertLogs, monthKey, THRESHOLDS };
