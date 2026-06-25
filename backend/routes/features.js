const Budget = require("../models/budget");
const Goal = require("../models/goal");
const RecurringTransaction = require("../models/recurringTransaction");
const Notification = require("../models/notification");
const Transaction = require("../models/transaction");
const Account = require("../models/account");
const Category = require("../models/category");
const { recalculateAccountBalance } = require("../utils/accountBalance");
const { resetBudgetAlertLogs, checkBudgetAlerts } = require("../utils/budgetAlerts");
const { clearAuthCookie } = require("../utils/authCookie");

const registerFeatureRoutes = (app, userAuth) => {
  /* ================= LOGOUT ================= */
  app.post("/logout", userAuth, (req, res) => {
    clearAuthCookie(res);
    res.json({ message: "Logged out" });
  });

  /* ================= BUDGETS ================= */
  app.get("/budgets", userAuth, async (req, res) => {
    try {
      const { month } = req.query;
      const filter = { userId: req.userId };
      if (month) filter.month = month;
      const budgets = await Budget.find(filter)
        .populate("categoryId", "name type")
        .sort({ createdAt: -1 });
      res.json(budgets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/budgets", userAuth, async (req, res) => {
    try {
      const { name, categoryId, amount, month, alertThreshold } = req.body;
      const budget = await Budget.create({
        userId: req.userId,
        name,
        categoryId: categoryId || null,
        amount: Number(amount),
        month: month || new Date().toISOString().slice(0, 7),
        alertThreshold: alertThreshold ?? 80,
      });
      await budget.populate("categoryId", "name type");
      res.status(201).json(budget);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/budgets/:id", userAuth, async (req, res) => {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true }
      ).populate("categoryId", "name type");
      if (!budget) return res.status(404).json({ error: "Budget not found" });
      await resetBudgetAlertLogs(budget._id);
      res.json(budget);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/budgets/:id", userAuth, async (req, res) => {
    try {
      const result = await Budget.deleteOne({ _id: req.params.id, userId: req.userId });
      if (!result.deletedCount) return res.status(404).json({ error: "Budget not found" });
      res.json({ message: "Budget deleted" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/budgets/tracking", userAuth, async (req, res) => {
    try {
      const month = req.query.month || new Date().toISOString().slice(0, 7);
      const { start, end } = (() => {
        const s = new Date(`${month}-01T00:00:00.000Z`);
        const e = new Date(s);
        e.setUTCMonth(e.getUTCMonth() + 1);
        return { start: s, end: e };
      })();

      const budgets = await Budget.find({ userId: req.userId, month });
      const expenses = await Transaction.find({
        user_id: req.userId,
        type: "expense",
        transaction_date: { $gte: start, $lt: end },
      }).populate("category_id", "name");

      const tracking = budgets.map((b) => {
        const spent = expenses
          .filter((t) => {
            if (!b.categoryId) return true;
            const catId = t.category_id?._id?.toString() || t.category_id?.toString();
            return catId === b.categoryId.toString();
          })
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        return {
          budget: b,
          spent,
          remaining: Math.max(0, b.amount - spent),
          percent: Math.min(100, percent),
          alert: percent >= b.alertThreshold,
        };
      });

      res.json({ month, tracking });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /* ================= GOALS ================= */
  app.get("/goals", userAuth, async (req, res) => {
    try {
      const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
      res.json(goals);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/goals", userAuth, async (req, res) => {
    try {
      const { name, targetAmount, currentAmount, deadline, icon } = req.body;
      const goal = await Goal.create({
        userId: req.userId,
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount || 0),
        deadline,
        icon,
      });
      res.status(201).json(goal);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/goals/:id", userAuth, async (req, res) => {
    try {
      const goal = await Goal.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true }
      );
      if (!goal) return res.status(404).json({ error: "Goal not found" });
      if (goal.currentAmount >= goal.targetAmount) goal.status = "completed";
      await goal.save();
      res.json(goal);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/goals/:id", userAuth, async (req, res) => {
    try {
      const result = await Goal.deleteOne({ _id: req.params.id, userId: req.userId });
      if (!result.deletedCount) return res.status(404).json({ error: "Goal not found" });
      res.json({ message: "Goal deleted" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  /* ================= RECURRING ================= */
  app.get("/recurring", userAuth, async (req, res) => {
    try {
      const items = await RecurringTransaction.find({ userId: req.userId })
        .populate("categoryId", "name type")
        .populate("accountId", "name")
        .sort({ createdAt: -1 });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/recurring", userAuth, async (req, res) => {
    try {
      const item = await RecurringTransaction.create({
        userId: req.userId,
        ...req.body,
        amount: Number(req.body.amount),
      });
      await item.populate("categoryId", "name type");
      await item.populate("accountId", "name");
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/recurring/:id", userAuth, async (req, res) => {
    try {
      const item = await RecurringTransaction.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true }
      )
        .populate("categoryId", "name type")
        .populate("accountId", "name");
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/recurring/:id", userAuth, async (req, res) => {
    try {
      const result = await RecurringTransaction.deleteOne({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!result.deletedCount) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  /* ================= NOTIFICATIONS ================= */
  app.get("/notifications", userAuth, async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(50);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/notifications", userAuth, async (req, res) => {
    try {
      const notification = await Notification.create({
        userId: req.userId,
        ...req.body,
      });
      res.status(201).json(notification);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/notifications/:id/read", userAuth, async (req, res) => {
    try {
      const n = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: { isRead: true } },
        { new: true }
      );
      if (!n) return res.status(404).json({ error: "Not found" });
      res.json(n);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/notifications/read-all", userAuth, async (req, res) => {
    try {
      await Notification.updateMany({ userId: req.userId }, { $set: { isRead: true } });
      res.json({ message: "All marked as read" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/notifications/:id", userAuth, async (req, res) => {
    try {
      const result = await Notification.deleteOne({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!result.deletedCount) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Notification deleted" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  /* ================= ACCOUNT TRANSFER ================= */
  app.post("/account/transfer", userAuth, async (req, res) => {
    try {
      const { fromAccountId, toAccountId, amount, note } = req.body;
      const numericAmount = Number(amount);
      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      if (fromAccountId === toAccountId) {
        return res.status(400).json({ error: "Cannot transfer to same account" });
      }

      const [fromAccount, toAccount] = await Promise.all([
        Account.findOne({ _id: fromAccountId, userId: req.userId }),
        Account.findOne({ _id: toAccountId, userId: req.userId }),
      ]);
      if (!fromAccount || !toAccount) {
        return res.status(404).json({ error: "Account not found" });
      }
      if (Number(fromAccount.balance) < numericAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      let transferCategory = await Category.findOne({
        userId: req.userId,
        name: { $regex: /^transfer$/i },
      });
      if (!transferCategory) {
        transferCategory = await Category.create({
          userId: req.userId,
          name: "Transfer",
          type: "expense",
          isDefault: false,
        });
      }

      const date = new Date();
      const transferNote = note || `Transfer to ${toAccount.name}`;

      await Transaction.create({
        user_id: req.userId,
        account_id: fromAccountId,
        category_id: transferCategory._id,
        amount: numericAmount,
        type: "expense",
        note: transferNote,
        transaction_date: date,
      });

      await Transaction.create({
        user_id: req.userId,
        account_id: toAccountId,
        category_id: transferCategory._id,
        amount: numericAmount,
        type: "income",
        note: note || `Transfer from ${fromAccount.name}`,
        transaction_date: date,
      });

      await recalculateAccountBalance({ userId: req.userId, accountId: fromAccountId });
      await recalculateAccountBalance({ userId: req.userId, accountId: toAccountId });

      res.json({ message: "Transfer completed" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  /* ================= ACCOUNT BALANCE HISTORY ================= */
  app.get("/account/:id/history", userAuth, async (req, res) => {
    try {
      const account = await Account.findOne({ _id: req.params.id, userId: req.userId });
      if (!account) return res.status(404).json({ error: "Account not found" });

      const txns = await Transaction.find({
        user_id: req.userId,
        account_id: req.params.id,
      })
        .sort({ transaction_date: 1 })
        .populate("category_id", "name");

      let running = 0;
      const history = txns.map((t) => {
        const amt = Number(t.amount || 0);
        if (t.type === "income") running += amt;
        else running -= amt;
        return {
          date: t.transaction_date,
          balance: running,
          amount: amt,
          type: t.type,
          note: t.note,
          category: t.category_id?.name,
        };
      });

      res.json({ account, history });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /* ================= REPORTS ================= */
  app.get("/reports/summary", userAuth, async (req, res) => {
    try {
      const { period = "monthly" } = req.query;
      const now = new Date();
      let start;

      if (period === "weekly") {
        start = new Date(now);
        start.setDate(now.getDate() - 7);
      } else if (period === "yearly") {
        start = new Date(now.getFullYear(), 0, 1);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const txns = await Transaction.find({
        user_id: req.userId,
        transaction_date: { $gte: start, $lte: now },
      }).populate("category_id", "name");

      let income = 0;
      let expense = 0;
      const byCategory = {};

      txns.forEach((t) => {
        const amt = Number(t.amount || 0);
        if (t.type === "income") income += amt;
        else {
          expense += amt;
          const cat = t.category_id?.name || "Other";
          byCategory[cat] = (byCategory[cat] || 0) + amt;
        }
      });

      res.json({
        period,
        start,
        end: now,
        income,
        expense,
        savings: income - expense,
        transactionCount: txns.length,
        categoryBreakdown: Object.entries(byCategory).map(([category, amount]) => ({
          category,
          amount,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /* ================= BULK TRANSACTION OPS ================= */
  app.delete("/transactions/bulk", userAuth, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || !ids.length) {
        return res.status(400).json({ error: "ids array required" });
      }
      const txns = await Transaction.find({ _id: { $in: ids }, user_id: req.userId });
      const accountIds = [...new Set(txns.map((t) => t.account_id.toString()))];
      await Transaction.deleteMany({ _id: { $in: ids }, user_id: req.userId });
      for (const accountId of accountIds) {
        await recalculateAccountBalance({ userId: req.userId, accountId });
      }
      res.json({ message: `${txns.length} transactions deleted` });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/transactions/bulk-category", userAuth, async (req, res) => {
    try {
      const { ids, category_id } = req.body;
      if (!Array.isArray(ids) || !category_id) {
        return res.status(400).json({ error: "ids and category_id required" });
      }
      const category = await Category.findOne({
        _id: category_id,
        $or: [{ userId: req.userId }, { isDefault: true }],
      });
      if (!category) return res.status(404).json({ error: "Category not found" });

      await Transaction.updateMany(
        { _id: { $in: ids }, user_id: req.userId, type: category.type },
        { $set: { category_id } }
      );

      if (category.type === "expense") {
        checkBudgetAlerts({
          userId: req.userId,
          categoryIds: [category_id],
          transactionDate: new Date(),
        }).catch((err) => console.error("Budget alert check failed:", err.message));
      }

      res.json({ message: "Categories updated" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
};

module.exports = { registerFeatureRoutes };
