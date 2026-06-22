import React, { useMemo, useEffect, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeIndianRupee,
  ClipboardList,
  Landmark,
  Pencil,
  Trash2,
} from "lucide-react";

const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const Spinner = ({ label = "Loading..." }) => (
  <div className="flex items-center justify-center py-16">
    <div className="flex items-center gap-3 text-gray-600">
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  </div>
);

const SummaryCard = ({ label, value, tone = "slate" }) => {
  const tones = {
    slate: "bg-white",
    green: "bg-white",
    red: "bg-white",
  };
  const valueTone =
    tone === "green"
      ? "text-emerald-600"
      : tone === "red"
        ? "text-red-600"
        : "text-gray-900";

  return (
    <div
      className={`rounded-2xl border border-gray-100 shadow-sm p-4 transition-all duration-200 hover:shadow-md ${tones[tone]}`}
    >
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-xl font-bold tracking-tight ${valueTone}`}>
        {value}
      </p>
    </div>
  );
};

const Pill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
      active
        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:shadow-sm"
    }`}
  >
    {children}
  </button>
);

const Tag = ({ children, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
};

const TransactionCard = ({ txn, isLoanTxn, onEdit, onDelete }) => {
  const isIncome = txn.type === "income";
  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
  const title =
    txn.note?.trim() ||
    txn.category_id?.name ||
    (isIncome ? "Income" : "Expense");
  const subtitle = new Date(txn.transaction_date).toLocaleDateString();

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 transition-all duration-200 hover:shadow-md flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              isIncome
                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                : "bg-red-50 border-red-100 text-red-600"
            }`}
          >
            <Icon size={16} />
          </div>

          <div className="min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 truncate">{title}</p>
              {isLoanTxn(txn) ? <Tag tone="blue">Loan</Tag> : null}
              {txn.category_id?.name && !isLoanTxn(txn) ? (
                <Tag tone="gray">{txn.category_id.name}</Tag>
              ) : null}
            </div>
            <p className="text-xs text-gray-500 leading-tight">{subtitle}</p>
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col gap-1 items-end">
          <p
            className={`text-base md:text-lg font-bold ${
              isIncome ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatINR(txn.amount)}
          </p>
          <p className="text-[11px] md:text-xs text-gray-500 capitalize leading-tight">
            {txn.type}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => onEdit(txn._id)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          <Pencil size={16} /> Edit
        </button>
        <button
          onClick={() => onDelete(txn._id)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-xs sm:text-sm font-semibold text-white hover:bg-red-700 transition"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
};

const toDateInputValue = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const EditTransactionModal = ({
  open,
  onClose,
  editTransaction,
  categories,
  categoriesLoading,
  submitting,
  error,
  onSubmit,
}) => {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (!open || !editTransaction) return;
    setAmount(editTransaction.amount ?? "");
    setCategoryId(
      editTransaction.category_id?._id ??
        editTransaction.category_id ??
        ""
    );
    setDescription(editTransaction.note ?? "");
    setDate(toDateInputValue(editTransaction.transaction_date));
  }, [open, editTransaction]);

  const filteredCategories = useMemo(() => {
    if (!editTransaction?.type) return [];
    return (categories || []).filter((c) => c.type === editTransaction.type);
  }, [categories, editTransaction]);

  if (!open || !editTransaction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-lg md:rounded-xl bg-white p-3 shadow-lg max-h-[85vh] md:max-h-[90vh] md:p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
          <div className="flex items-start justify-between gap-3">
          <div>
              <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                Edit Transaction
              </h2>
              <p className="mt-1 text-sm text-gray-500 leading-tight">
                Update amount, category, note, and date.
              </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            aria-label="Close"
            disabled={submitting}
          >
            Close
          </button>
        </div>

        <form
          className="mt-3 flex flex-col gap-2 md:gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              amount,
              category_id: categoryId,
              description,
              date,
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Amount
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 md:py-3.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Category
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoriesLoading || submitting}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 md:py-3.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:opacity-60"
            >
              <option value="" disabled>
                {categoriesLoading
                  ? "Loading..."
                  : filteredCategories.length
                  ? "Select category"
                  : "No categories available"}
              </option>
              {filteredCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short description"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 md:py-3.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 md:py-3.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full rounded-xl bg-gray-50 px-4 py-2.5 md:py-3.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 transition active:scale-[0.99] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 md:py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.98] transition disabled:opacity-60"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white"
                    aria-hidden
                  />
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("all"); // all | income | expense

  // Edit transaction state
  const [editTransaction, setEditTransaction] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const navigate = useNavigate();
  const limit = 10;

  const isLoanTxn = (txn) =>
    Boolean(txn?.linkedLoanId) ||
    String(txn?.category_id?.name || "").toLowerCase() === "loan";

  const filteredTransactions = useMemo(() => {
    if (filterType === "income")
      return transactions.filter((t) => t.type === "income");
    if (filterType === "expense")
      return transactions.filter((t) => t.type === "expense");
    return transactions;
  }, [transactions, filterType]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/transactions?page=${page}&limit=${limit}`);
      setTransactions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await api.get("/get/categories");
      setCategories(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const openEdit = async (id) => {
    const txn = transactions.find((t) => t._id === id);
    if (!txn) return;

    setEditTransaction(txn);
    setEditError("");
    setIsEditOpen(true);

    // Lazy-load categories when opening modal
    if (!categories.length && !categoriesLoading) {
      await fetchCategories();
    }
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditTransaction(null);
    setEditSubmitting(false);
    setEditError("");
  };

  const submitEdit = async ({ amount, category_id, description, date }) => {
    if (!editTransaction) return;

    try {
      setEditSubmitting(true);
      setEditError("");

      const payload = {
        amount,
        category_id,
        description,
        date,
      };

      const res = await api.put(`/transactions/${editTransaction._id}`, payload);

      const updated = res.data;
      setTransactions((prev) =>
        prev.map((txn) => (txn._id === updated._id ? updated : txn))
      );
      window.dispatchEvent(new Event("finance-data-changed"));

      toast.success("Transaction updated");
      closeEdit();
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update transaction";
      setEditError(message);
      toast.error(message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;

    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
      window.dispatchEvent(new Event("finance-data-changed"));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full min-h-full bg-gray-50 overflow-x-hidden pb-24">
      <div className="max-w-5xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-white border border-gray-100 rounded-lg md:rounded-2xl shadow-sm p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <ClipboardList size={20} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
                  Transactions
                </h1>
                <p className="text-sm text-gray-500">
                  Track income, expenses, and loan-linked activity.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/transactions/new")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all duration-200"
            >
              <BadgeIndianRupee size={18} />
              Add Transaction
            </button>
          </div>

          {/* Summary strip */}
          <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCard
              label="Total Income"
              value={formatINR(totals.income)}
              tone="green"
            />
            <SummaryCard
              label="Total Expense"
              value={formatINR(totals.expense)}
              tone="red"
            />
            <SummaryCard
              label="Balance"
              value={formatINR(totals.balance)}
              tone="slate"
            />
          </div>

          {/* Filters */}
          <div className="mt-4 md:mt-5 flex items-center gap-2 flex-wrap">
            <Pill active={filterType === "all"} onClick={() => setFilterType("all")}>
              All
            </Pill>
            <Pill
              active={filterType === "income"}
              onClick={() => setFilterType("income")}
            >
              Income
            </Pill>
            <Pill
              active={filterType === "expense"}
              onClick={() => setFilterType("expense")}
            >
              Expense
            </Pill>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 border-t border-gray-200 pt-4 md:mt-8 md:pt-6 lg:mt-10">
          {loading ? (
            <Spinner label="Fetching transactions..." />
          ) : transactions.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <Landmark size={22} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No transactions yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your first transaction to start tracking your cashflow.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate("/transactions/new")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all duration-200"
                >
                  <BadgeIndianRupee size={18} />
                  Add Transaction
                </button>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-sm">
                <Landmark size={22} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No matching transactions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try switching the filter.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-5">
              {filteredTransactions.map((txn) => (
                <TransactionCard
                  key={txn._id}
                  txn={txn}
                  isLoanTxn={isLoanTxn}
                  onEdit={(id) => openEdit(id)}
                  onDelete={(id) => handleDelete(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => setPage((prev) => prev - 1)}
            disabled={page === 1}
            className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-all duration-200"
          >
            Prev
          </button>
          <span className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700">
            Page {page}
          </span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            Next
          </button>
        </div>
      </div>

      <EditTransactionModal
        open={isEditOpen}
        onClose={closeEdit}
        editTransaction={editTransaction}
        categories={categories}
        categoriesLoading={categoriesLoading}
        submitting={editSubmitting}
        error={editError}
        onSubmit={submitEdit}
      />
    </div>
  );
};

export default Transactions;
