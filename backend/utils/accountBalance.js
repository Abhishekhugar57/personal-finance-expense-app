const mongoose = require("mongoose");
const Transaction = require("../models/transaction");
const Account = require("../models/account");

async function computeAccountBalanceFromTransactions({ userId, accountId, session }) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const accountObjectId = new mongoose.Types.ObjectId(accountId);

  const [result] = await Transaction.aggregate(
    [
      {
        $match: {
          user_id: userObjectId,
          account_id: accountObjectId,
        },
      },
      {
        $group: {
          _id: null,
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
    ],
    session ? { session } : {}
  );

  const income = Number(result?.income || 0);
  const expense = Number(result?.expense || 0);
  return income - expense;
}

async function recalculateAccountBalance({ userId, accountId, session }) {
  const nextBalance = await computeAccountBalanceFromTransactions({
    userId,
    accountId,
    session,
  });

  await Account.findOneAndUpdate(
    { _id: accountId, userId },
    { $set: { balance: nextBalance } },
    session ? { session } : {}
  );

  return nextBalance;
}

module.exports = {
  computeAccountBalanceFromTransactions,
  recalculateAccountBalance,
};
