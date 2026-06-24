const Loan = require("../models/loan");
const Account = require("../models/account");
const Category = require("../models/category");
const Transaction = require("../models/transaction");
const { applyMonthlyInterest, computeDueDate } = require("../utils/loanInterest");
const { recalculateAccountBalance } = require("../utils/accountBalance");
const { checkBudgetAlerts } = require("../utils/budgetAlerts");

async function getOrCreateLoanCategory({ userId, type }) {
  const name = "Loan";
  let category = await Category.findOne({ userId, name, type });
  if (!category) {
    category = await Category.create({ userId, name, type });
  }
  return category;
}

async function createTransactionAndUpdateBalance({
  userId,
  accountId,
  categoryId,
  amount,
  type,
  note,
  linkedLoanId,
  transaction_date = new Date(),
}) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const err = new Error("Invalid amount");
    err.statusCode = 400;
    throw err;
  }

  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    const err = new Error("Account not found");
    err.statusCode = 404;
    throw err;
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  if (category.type !== type) {
    const err = new Error("Category type mismatch");
    err.statusCode = 400;
    throw err;
  }

  const currentBalance = Number(account.balance || 0);
  if (type === "expense" && currentBalance < numericAmount) {
    const err = new Error("Insufficient balance");
    err.statusCode = 400;
    throw err;
  }

  const txn = await Transaction.create({
    user_id: userId,
    account_id: accountId,
    category_id: categoryId,
    amount: numericAmount,
    type,
    note,
    transaction_date,
    linkedLoanId: linkedLoanId || null,
  });

  await recalculateAccountBalance({ userId, accountId });

  if (type === "expense") {
    checkBudgetAlerts({
      userId,
      categoryIds: [categoryId],
      transactionDate: transaction_date,
    }).catch((err) => console.error("Budget alert check failed:", err.message));
  }

  return txn;
}

// POST /loan
async function createLoan(req, res) {
  try {
    const userId = req.userId;
    const {
      personName,
      type, // GIVEN | TAKEN
      principalAmount,
      accountId,
      startDate,
      interestRate = 0,
      durationMonths = 12,
    } = req.body;

    if (!personName || !type || !principalAmount || !accountId || !startDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["GIVEN", "TAKEN"].includes(type)) {
      return res.status(400).json({ message: "Invalid loan type" });
    }

    const principal = Number(principalAmount);
    if (!Number.isFinite(principal) || principal <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const dueDate = computeDueDate(new Date(startDate), durationMonths);

    const loan = await Loan.create({
      userId,
      personName,
      type,
      loanType: type === "TAKEN" ? "taken" : "given",
      principalAmount: principal,
      amount: principal,
      outstandingAmount: principal,
      remainingAmount: principal,
      accountId,
      startDate,
      dueDate,
      durationMonths: Number(durationMonths || 12),
      lastInterestAppliedDate: new Date(startDate),
      totalInterestAccrued: 0,
      interestRate: Number(interestRate || 0), // monthly %
      status: "ACTIVE",
      paymentStatus: "pending",
    });

    // Sync transaction
    const txnType = type === "TAKEN" ? "income" : "expense";
    const category = await getOrCreateLoanCategory({ userId, type: txnType });

    const note =
      type === "TAKEN"
        ? `Loan taken from ${personName}`
        : `Loan given to ${personName}`;

    await createTransactionAndUpdateBalance({
      userId,
      accountId,
      categoryId: category._id,
      amount: principal,
      type: txnType,
      note,
      linkedLoanId: loan._id,
      transaction_date: new Date(startDate),
    });

    const populated = await Loan.findById(loan._id).populate(
      "accountId",
      "name balance"
    );

    return res.status(201).json({ message: "Loan created", loan: populated });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

// PATCH /loan/:id (metadata only)
async function updateLoan(req, res) {
  try {
    const userId = req.userId;
    const { personName, startDate, interestRate, status, durationMonths } =
      req.body;

    const existing = await Loan.findOne({ _id: req.params.id, userId });
    if (!existing) return res.status(404).json({ message: "Loan not found" });

    const applied = applyMonthlyInterest(existing);
    if (applied.updated) await existing.save();

    const updates = {};
    if (personName !== undefined) updates.personName = personName;
    if (startDate !== undefined) updates.startDate = startDate;
    if (interestRate !== undefined)
      updates.interestRate = Number(interestRate || 0);
    if (durationMonths !== undefined) {
      updates.durationMonths = Number(durationMonths || 12);
      updates.dueDate = computeDueDate(
        new Date(startDate ?? existing.startDate),
        updates.durationMonths
      );
    }
    if (startDate !== undefined && durationMonths === undefined) {
      updates.dueDate = computeDueDate(
        new Date(startDate),
        existing.durationMonths || 12
      );
    }

    if (status !== undefined) {
      if (!["ACTIVE", "CLOSED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      updates.status = status;
      updates.paymentStatus = status === "CLOSED" ? "paid" : "pending";
      if (status === "CLOSED") {
        updates.outstandingAmount = 0;
        updates.remainingAmount = 0;
      }
    }

    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId },
      updates,
      { new: true }
    ).populate("accountId", "name balance");

    if (!loan) return res.status(404).json({ message: "Loan not found" });

    return res.status(200).json({ message: "Loan updated", loan });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// POST /loan/:id/payment
async function repayLoan(req, res) {
  try {
    const userId = req.userId;
    const { amount } = req.body;
    const payAmount = Number(amount);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const loan = await Loan.findOne({ _id: req.params.id, userId });
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if ((loan.paymentStatus || "pending") !== "pending" || loan.status !== "ACTIVE") {
      return res.status(400).json({ message: "Loan is not active" });
    }

    const applied = applyMonthlyInterest(loan);
    if (applied.updated) await loan.save();

    const remainingBefore = Number(
      loan.remainingAmount ?? loan.outstandingAmount ?? 0
    );

    if (payAmount > remainingBefore) {
      return res.status(400).json({ message: "Amount exceeds remaining" });
    }

    // Repayment direction
    // TAKEN  -> I repay -> expense
    // GIVEN  -> they repay me -> income
    const txnType = loan.type === "TAKEN" ? "expense" : "income";
    const category = await getOrCreateLoanCategory({ userId, type: txnType });

    const note =
      loan.type === "TAKEN"
        ? `Loan repayment to ${loan.personName}`
        : `Loan repayment from ${loan.personName}`;

    await createTransactionAndUpdateBalance({
      userId,
      accountId: loan.accountId,
      categoryId: category._id,
      amount: payAmount,
      type: txnType,
      note,
      linkedLoanId: loan._id,
      transaction_date: new Date(),
    });

    const remainingAfter = remainingBefore - payAmount;
    loan.remainingAmount = remainingAfter;
    loan.outstandingAmount = remainingAfter;
    if (loan.remainingAmount <= 0) {
      loan.remainingAmount = 0;
      loan.outstandingAmount = 0;
      loan.status = "CLOSED";
      loan.paymentStatus = "paid";
    }
    await loan.save();

    const populated = await Loan.findById(loan._id).populate(
      "accountId",
      "name balance"
    );

    return res.status(200).json({ message: "Payment recorded", loan: populated });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

async function getLoans(req, res) {
  try {
    const userId = req.userId;
    const loans = await Loan.find({ userId })
      .populate("accountId", "name balance")
      .sort({ createdAt: -1 });

    await Promise.all(
      loans.map(async (loan) => {
        const applied = applyMonthlyInterest(loan);
        if (!loan.dueDate) {
          loan.dueDate = computeDueDate(loan.startDate, loan.durationMonths || 12);
        }
        if (applied.updated || loan.isModified("dueDate")) {
          await loan.save();
        }
      })
    );

    const refreshed = await Loan.find({ userId })
      .populate("accountId", "name balance")
      .sort({ createdAt: -1 });

    return res.json(refreshed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createLoan, updateLoan, repayLoan, getLoans };

