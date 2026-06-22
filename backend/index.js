require("dotenv").config();
const express = require("express");
const connectDb = require("./config/db");
const User = require("./models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middleware/auth");
const Account = require("./models/account");
const Category = require("./models/category");
const mongoose = require("mongoose");
const Transaction = require("./models/transaction");
const Loan = require("./models/loan");
const cors = require("cors");
const {
  createLoan,
  updateLoan: updateLoanController,
  repayLoan,
  getLoans,
} = require("./controllers/loanController");
const { recalculateAccountBalance } = require("./utils/accountBalance");
const { ensureDefaultCategories } = require("./utils/defaultCategories");

const app = express();

const parseMonthRange = (month) => {
  const normalizedMonth =
    typeof month === "string" && /^\d{4}-\d{2}$/.test(month)
      ? month
      : new Date().toISOString().slice(0, 7);
  const start = new Date(`${normalizedMonth}-01T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
};

const isTransferLikeTxn = (txn) => {
  const note = String(txn?.note || "").trim().toLowerCase();
  const categoryName = String(txn?.category_id?.name || "")
    .trim()
    .toLowerCase();
  return note.startsWith("transfer") || categoryName === "transfer";
};

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 ADD THIS RIGHT HERE

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// preflight

//app.use(express.json());
//app.use(express.json({ strict: false }));
// Only parse JSON for POST/PUT/PATCH requests

// connect to DB
connectDb();

// routes (later)
app.get("/", (req, res) => {
  res.send("API is running...");
});
const findUserByEmail = (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  return User.findOne({
    $expr: { $eq: [{ $toLower: "$email" }, normalizedEmail] },
  });
};

app.post("/signup", async (req, res) => {
  try {
    console.log("🔍 SIGNUP REQUEST RECEIVED");
    console.log("📝 Request body:", req.body);

    const { userName, email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    console.log("📧 Extracted email:", normalizedEmail);
    console.log("👤 Extracted username:", userName);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Password hashed");

    const existingUser = await findUserByEmail(normalizedEmail);
    console.log(
      "🔍 Existing user check:",
      existingUser ? "Found" : "Not found"
    );

    if (existingUser) {
      console.log("⚠️ User already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      userName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    console.log("💾 Attempting to save user to Atlas...");
    const savedUser = await user.save();
    console.log("✅ User saved successfully!");
    console.log("🆔 Saved user ID:", savedUser._id);
    console.log("📊 Database:", mongoose.connection.name);

    await ensureDefaultCategories(savedUser._id);

    res.status(201).json({
      message: "User created successfully",
      user: savedUser,
    });
  } catch (err) {
    console.error("❌ SIGNUP ERROR:", err.message);
    console.error("📋 Full error:", err);
    res.status(400).json({ error: err.message });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (!existingUser) {
      return res.status(401).json({ message: "No account found. Please sign up first." });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server auth configuration error" });
    }

    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax", // Changed for local development
      secure: false, // Changed for local development
    });
    res.status(200).json({
      message: "Login successful",
      existingUser,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});
/* ================= CREATE ACCOUNT ================= */
/*app.post("/account", userAuth, async (req, res) => {
  try {
    const { name, type, balance } = req.body;

    const account = new Account({
      userId: req.userId,
      name,
      type,
      balance,
    });

    await account.save();

    res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});*/

app.get("/profile", userAuth, async (req, res) => {
  try {
    res.status(200).json({
      user: {
        _id: req.user._id,
        userName: req.user.userName,
        email: req.user.email,
      },
    });
  } catch (err) {
    res.status(400).send("Error fetching profile");
  }
});

app.put("/user/profile", userAuth, async (req, res) => {
  try {
    const { name, userName, email } = req.body || {};
    const nextUserName = String(userName ?? name ?? "").trim();
    const nextEmail = String(email ?? "")
      .trim()
      .toLowerCase();

    if (!nextUserName) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!nextEmail || !validator.isEmail(nextEmail)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const existingWithEmail = await User.findOne({
      email: nextEmail,
      _id: { $ne: req.userId },
    });

    if (existingWithEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          userName: nextUserName,
          email: nextEmail,
        },
      },
      { new: true, runValidators: true }
    ).select("_id userName email");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});
app.post("/account", userAuth, async (req, res) => {
  try {
    const { name, type, balance = 0 } = req.body;
    const userId = req.userId;

    await ensureDefaultCategories(userId);

    // 1️⃣ Create Account
    const account = new Account({
      userId,
      name,
      type,
      balance,
    });

    await account.save();

    // 2️⃣ If initial balance > 0 → create Opening Balance transaction
    if (balance > 0) {
      // Find or create Opening Balance category
      let openingCategory = await Category.findOne({
        userId,
        name: "Opening Balance",
        type: "income",
      });

      if (!openingCategory) {
        openingCategory = new Category({
          userId,
          name: "Opening Balance",
          type: "income",
        });

        await openingCategory.save();
      }

      // 3️⃣ Create Opening Balance transaction
      const openingTransaction = new Transaction({
        user_id: userId,
        account_id: account._id,
        category_id: openingCategory._id,
        amount: balance,
        type: "income",
        note: "Opening Balance",
        isOpeningBalance: true,
        transaction_date: new Date(),
      });

      await openingTransaction.save();
    }

    res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ================= GET ALL ACCOUNTS ================= */
app.get("/get/account", userAuth, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId });

    res.status(200).json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE ACCOUNT ================= */
app.patch("/account/:id", userAuth, async (req, res) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "balance")) {
      return res.status(400).json({
        message:
          "Direct balance updates are not allowed. Update balances through transactions.",
      });
    }

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ================= DELETE ACCOUNT ================= */
app.delete("/accountdelete/:id", userAuth, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const linkedLoan = await Loan.findOne({
      userId: req.userId,
      accountId: req.params.id,
      status: "ACTIVE",
    });
    if (linkedLoan) {
      return res.status(400).json({
        message:
          "This account is linked to an active loan. Close or reassign the loan first.",
      });
    }

    await Transaction.deleteMany({
      user_id: req.userId,
      account_id: req.params.id,
    });

    await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    res.status(200).json({
      message: "Account deleted successfully",
      deletedId: req.params.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/category", userAuth, async (req, res) => {
  try {
    const { name, type } = req.body;

    const category = new Category({
      userId: req.userId,
      name,
      type,
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/get/categories", userAuth, async (req, res) => {
  try {
    await ensureDefaultCategories(req.userId);

    const categories = await Category.find({ userId: req.userId }).sort({
      type: 1,
      name: 1,
    });

    res.json({ data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/categoryupdate/:id", userAuth, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a category
app.delete("/categoryDelete/:id", userAuth, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/transactions", userAuth, async (req, res) => {
  try {
    const userId = req.userId;

    let { account_id, category_id, amount, type, note, transaction_date } =
      req.body;

    // 🔒 Convert amount to number immediately
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      throw new Error("Invalid amount");
    }

    // 1️⃣ Validate account
    const account = await Account.findOne({ _id: account_id, userId });
    if (!account) throw new Error("Account not found");

    // 2️⃣ Validate category
    const category = await Category.findById(category_id);
    if (!category) throw new Error("Category not found");
    // 3️⃣ Business rules
    if (category.type !== type) {
      throw new Error("Category type mismatch");
    }

    const currentBalance = Number(account.balance);

    if (type === "expense" && currentBalance < numericAmount) {
      throw new Error("Insufficient balance");
    }

    // 4️⃣ Create transaction
    const transaction = new Transaction({
      user_id: userId,
      account_id,
      category_id,
      amount: numericAmount, // ✅ store as number
      type,
      note,
      transaction_date,
    });

    // 5️⃣ Save transaction and recalculate canonical balance from history
    await transaction.save();
    await recalculateAccountBalance({ userId, accountId: account_id });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
/* ================= GET ALL TRANSACTIONS ================= */
app.get("/transactions", userAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.find({ user_id: req.userId })
      .populate("category_id", "name type")
      .sort({ transaction_date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= GET SINGLE TRANSACTION ================= */
app.get("/transactions/:id", userAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ================= UPDATE TRANSACTION ================= */
app.put("/transactions/:id", userAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      user_id: req.userId,
    });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const {
      amount,
      category_id,
      note,
      transaction_date,
      category: categoryInput,
      description,
      date,
    } = req.body;

    const updatedAmount = Number(amount);
    if (!Number.isFinite(updatedAmount) || updatedAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const updatedCategoryId =
      category_id ?? categoryInput ?? transaction.category_id;
    if (!updatedCategoryId) {
      return res.status(400).json({ error: "Category is required" });
    }

    const updatedNote = note ?? description;
    const updatedDateRaw = transaction_date ?? date;
    const updatedDate = updatedDateRaw ? new Date(updatedDateRaw) : null;

    if (updatedDateRaw && Number.isNaN(updatedDate.getTime())) {
      return res.status(400).json({ error: "Invalid transaction date" });
    }

    // Validate category belongs to this user OR is default
    const category = await Category.findOne({
      _id: updatedCategoryId,
      $or: [{ userId: req.userId }, { isDefault: true }],
    });
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Ensure category matches transaction type (income vs expense)
    if (category.type !== transaction.type) {
      return res.status(400).json({ error: "Category type mismatch" });
    }

    // Validate account belongs to this user
    const account = await Account.findOne({
      _id: transaction.account_id,
      userId: req.userId,
    });
    if (!account) return res.status(404).json({ error: "Account not found" });

    // Reverse old transaction effect on balance, then apply updated amount
    const oldAmount = Number(transaction.amount || 0);
    const balanceBeforeOld =
      transaction.type === "expense"
        ? Number(account.balance || 0) + oldAmount
        : Number(account.balance || 0) - oldAmount;

    if (transaction.type === "expense" && balanceBeforeOld < updatedAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const updated = await Transaction.findByIdAndUpdate(
      id,
      {
        $set: {
          amount: updatedAmount,
          category_id: updatedCategoryId,
          note: updatedNote !== undefined ? updatedNote : transaction.note,
          transaction_date: updatedDate ?? transaction.transaction_date,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await recalculateAccountBalance({
      userId: req.userId,
      accountId: transaction.account_id,
    });
    await updated.populate("category_id", "name type");

    return res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ================= DELETE TRANSACTION ================= */
app.delete("/transactions/:id", userAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });
    if (!transaction) throw new Error("Transaction not found");

    const account = await Account.findOne({
      _id: transaction.account_id,
      userId: req.userId,
    });
    if (!account) throw new Error("Account not found");
    await transaction.deleteOne();
    await recalculateAccountBalance({
      userId: req.userId,
      accountId: transaction.account_id,
    });

    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/loan", userAuth, createLoan);

app.get("/get/loan", userAuth, async (req, res) => {
  return getLoans(req, res);
});

// Update loan metadata (safe fields only)
app.patch("/loan/:id", userAuth, updateLoanController);

// Delete loan (restricted to loans without repayments)
app.delete("/loan/:id", userAuth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // If repayments happened, deleting would require rolling back multiple txns.
    // Restrict delete to "only the initial loan transaction exists".
    const loanTxns = await Transaction.find({
      user_id: req.userId,
      linkedLoanId: loan._id,
    }).sort({ createdAt: 1 });

    if (loanTxns.length !== 1) {
      return res.status(400).json({
        message:
          "This loan has repayments. Delete is disabled to prevent incorrect balances.",
      });
    }

    const initialTxn = loanTxns[0];
    const account = await Account.findOne({
      _id: initialTxn.account_id,
      userId: req.userId,
    });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // rollback balance from initial loan transaction
    const amt = Number(initialTxn.amount || 0);
    account.balance =
      initialTxn.type === "expense"
        ? Number(account.balance || 0) + amt
        : Number(account.balance || 0) - amt;

    await account.save();
    await initialTxn.deleteOne();
    await loan.deleteOne();

    res.status(200).json({ message: "Loan deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New canonical repayment route
app.post("/loan/:id/payment", userAuth, repayLoan);
// Backward compatibility (older frontend may call this)
app.post("/:id/payment", userAuth, repayLoan);

app.get("/dashboard/accounts", userAuth, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId });

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    res.json({
      totalBalance,
      accounts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/dashboard/income-expense", userAuth, async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const range = parseMonthRange(month);
    if (!range) {
      return res.status(400).json({ message: "Invalid month format" });
    }
    const { start, end } = range;

    const summary = await Transaction.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(req.userId),
          transaction_date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);

    let income = 0,
      expense = 0;

    summary.forEach((item) => {
      if (item._id === "income") income = item.total;
      if (item._id === "expense") expense = item.total;
    });

    res.json({
      income,
      expense,
      savings: income - expense,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/dashboard/category-breakdown", userAuth, async (req, res) => {
  try {
    const { month } = req.query;
    const range = parseMonthRange(month);
    if (!range) {
      return res.status(400).json({ message: "Invalid month format" });
    }
    const { start, end } = range;

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(req.userId),
          type: "expense",
          transaction_date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$category_id",
          total: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 0,
          category: "$category.name",
          amount: "$total",
        },
      },
    ]);

    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/dashboard/loan-summary", userAuth, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.userId });

    let totalGiven = 0;
    let totalTaken = 0;
    let totalOutstanding = 0;
    let activeLoans = 0;
    let closedLoans = 0;

    loans.forEach((loan) => {
      if (loan.type === "GIVEN") totalGiven += loan.principalAmount;
      if (loan.type === "TAKEN") totalTaken += loan.principalAmount;

      totalOutstanding += loan.outstandingAmount;

      loan.status === "ACTIVE" ? activeLoans++ : closedLoans++;
    });

    res.json({
      totalGiven,
      totalTaken,
      totalOutstanding,
      activeLoans,
      closedLoans,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/dashboard/overview", userAuth, async (req, res) => {
  try {
    const userId = req.userId;
    /* =========================
       1️⃣ TOTAL BALANCE
    ========================== */
    const accounts = await Account.find({ userId });

    const totalBalance = accounts.reduce(
      (acc, account) => acc + (account.balance || 0),
      0
    );

    /* =========================
       2️⃣ TRANSACTIONS
    ========================== */
    const transactions = await Transaction.find({ user_id: userId })
      .populate("category_id", "name")
      .sort({ transaction_date: 1 }); // oldest first for proper sorting

    let income = 0;
    let expense = 0;

    const monthlyMap = {};
    const categoryMap = {};

    transactions.forEach((txn) => {
      const amount = txn.amount || 0;

      /* ✅ OPTIONAL (Recommended)
         Exclude Opening Balance from income calculation
         Remove this if you WANT it included
      */
      const isOpeningBalance =
        txn.isOpeningBalance === true ||
        String(txn.note || "")
          .trim()
          .toLowerCase() === "opening balance";

      const isTransfer = isTransferLikeTxn(txn);

      // Income & Expense calculation (exclude transfer-like entries from totals)
      if (txn.type === "income" && !isOpeningBalance && !isTransfer) {
        income += amount;
      } else if (txn.type === "expense" && !isTransfer) {
        expense += amount;
      }

      /* =========================
         Monthly Data (Fixed)
      ========================== */
      const date = new Date(txn.transaction_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: date.toLocaleString("default", { month: "short" }),
          year: date.getFullYear(),
          income: 0,
          expense: 0,
          sortDate: new Date(date.getFullYear(), date.getMonth(), 1),
        };
      }

      if (txn.type === "income" && !isOpeningBalance && !isTransfer) {
        monthlyMap[monthKey].income += amount;
      } else if (txn.type === "expense" && !isTransfer) {
        monthlyMap[monthKey].expense += amount;
      }

      /* =========================
         Category Breakdown
      ========================== */
      if (txn.type === "expense" && !isTransfer) {
        const categoryName = txn.category_id?.name || "Other";

        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = 0;
        }

        categoryMap[categoryName] += amount;
      }
    });

    const monthlyData = Object.values(monthlyMap).sort(
      (a, b) => a.sortDate - b.sortDate
    );

    const categoryBreakdown = Object.keys(categoryMap).map((key) => ({
      category: key,
      amount: categoryMap[key],
    }));

    const savings = income - expense;

    /* =========================
       3️⃣ LOAN SUMMARY
    ========================== */
    const loans = await Loan.find({ userId });

    let totalGiven = 0;
    let totalTaken = 0;
    let totalOutstanding = 0;
    let activeLoans = 0;
    let closedLoans = 0;

    loans.forEach((loan) => {
      const principal = loan.principalAmount || 0;
      const outstanding = loan.outstandingAmount || 0;

      if (loan.type === "GIVEN") {
        totalGiven += principal;
      }

      if (loan.type === "TAKEN") {
        totalTaken += principal;
      }

      totalOutstanding += outstanding;

      if (loan.status === "ACTIVE") {
        activeLoans++;
      } else {
        closedLoans++;
      }
    });

    /* =========================
       4️⃣ RECENT TRANSACTIONS
    ========================== */
    const recentTransactions = transactions.slice(-5).reverse(); // latest 5

    /* =========================
       FINAL RESPONSE
    ========================== */
    res.status(200).json({
      totalBalance,
      income,
      expense,
      savings,
      monthlyData,
      categoryBreakdown,
      transactions,
      loanSummary: {
        totalGiven,
        totalTaken,
        totalOutstanding,
        activeLoans,
        closedLoans,
      },
      recentTransactions,
    });
  } catch (error) {
    console.error("Overview Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ================= SERVER
















================= */
