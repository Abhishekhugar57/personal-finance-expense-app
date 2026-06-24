import React, { useMemo, useEffect, useState, useCallback } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeIndianRupee,
  ClipboardList,
  Pencil,
  Trash2,
  Search,
  Download,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Pill,
  PageHeader,
  EmptyState,
  Modal,
  Input,
  Select,
  ConfirmDialog,
  SkeletonCard,
} from "./ui";
import { transactionApi } from "../services/featureService";
import {
  exportTransactionsCSV,
  exportTransactionsExcel,
  exportTransactionsPDF,
} from "../utils/export";
import { formatINR, formatDate, toDateInputValue } from "../utils/format";

const SwipeTransactionCard = ({ txn, isLoanTxn, selected, onSelect, onEdit, onDelete, selectionMode }) => {
  const isIncome = txn.type === "income";
  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
  const x = useMotionValue(0);
  const bg = useTransform(x, [-100, 0, 100], ["#EF4444", "#FFFFFF", "#4F46E5"]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -80) onDelete(txn._id);
    else if (info.offset.x > 80) onEdit(txn._id);
  };

  const title = txn.note?.trim() || txn.category_id?.name || (isIncome ? "Income" : "Expense");

  return (
    <motion.div
      style={{ x, backgroundColor: bg }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm overflow-hidden md:!transform-none md:!bg-[var(--app-surface)]"
    >
      <div className="p-4 flex items-center gap-3">
        {selectionMode ? (
          <button type="button" onClick={() => onSelect(txn._id)} className="shrink-0 text-[var(--app-primary)]">
            {selected ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>
        ) : null}
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[var(--app-text)] truncate text-sm">{title}</p>
            {isLoanTxn(txn) ? <Badge tone="primary">Loan</Badge> : null}
            {txn.category_id?.name && !isLoanTxn(txn) ? <Badge tone="neutral">{txn.category_id.name}</Badge> : null}
          </div>
          <p className="text-xs text-[var(--app-text-muted)]">{formatDate(txn.transaction_date)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold text-sm ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
            {isIncome ? "+" : "-"}{formatINR(txn.amount)}
          </p>
        </div>
      </div>
      <div className="hidden md:flex items-center justify-end gap-2 px-4 pb-4">
        <Button size="sm" variant="secondary" onClick={() => onEdit(txn._id)}><Pencil size={14} /> Edit</Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(txn._id)}><Trash2 size={14} /> Delete</Button>
      </div>
      <p className="md:hidden text-[10px] text-center text-[var(--app-text-muted)] pb-2">Swipe left to delete · right to edit</p>
    </motion.div>
  );
};

const EditTransactionModal = ({ open, onClose, editTransaction, categories, categoriesLoading, submitting, error, onSubmit }) => {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (!open || !editTransaction) return;
    setAmount(editTransaction.amount ?? "");
    setCategoryId(editTransaction.category_id?._id ?? editTransaction.category_id ?? "");
    setDescription(editTransaction.note ?? "");
    setDate(toDateInputValue(editTransaction.transaction_date));
  }, [open, editTransaction]);

  const filteredCategories = useMemo(() => {
    if (!editTransaction?.type) return [];
    return (categories || []).filter((c) => c.type === editTransaction.type);
  }, [categories, editTransaction]);

  if (!open || !editTransaction) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Transaction" description="Update amount, category, note, and date">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ amount, category_id: categoryId, description, date }); }}>
        <Input label="Amount" type="number" required min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select label="Category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={categoriesLoading || submitting}>
          <option value="" disabled>{categoriesLoading ? "Loading..." : "Select category"}</option>
          {filteredCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        {error ? <p className="text-sm text-[var(--app-danger)]" role="alert">{error}</p> : null}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={submitting}>Save</Button>
        </div>
      </form>
    </Modal>
  );
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState("");

  const navigate = useNavigate();
  const limit = 10;

  const isLoanTxn = (txn) =>
    Boolean(txn?.linkedLoanId) || String(txn?.category_id?.name || "").toLowerCase() === "loan";

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit, sort };
      if (filterType !== "all") params.type = filterType;
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get("/transactions", { params });
      const payload = res.data;
      if (Array.isArray(payload)) {
        setTransactions(payload);
        setTotal(payload.length);
      } else {
        setTransactions(payload.data || []);
        setTotal(payload.total || 0);
      }
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, filterType, search, dateFrom, dateTo, minAmount, maxAmount, categoryFilter, sort]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await api.get("/get/categories");
      setCategories(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchAllForExport = async () => {
    const params = { export: "true", sort };
    if (filterType !== "all") params.type = filterType;
    if (search) params.search = search;
    const res = await api.get("/transactions", { params });
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  };

  const openEdit = async (id) => {
    const txn = transactions.find((t) => t._id === id);
    if (!txn) return;
    setEditTransaction(txn);
    setEditError("");
    setIsEditOpen(true);
    if (!categories.length) await fetchCategories();
  };

  const closeEdit = () => { setIsEditOpen(false); setEditTransaction(null); setEditSubmitting(false); setEditError(""); };

  const submitEdit = async (payload) => {
    if (!editTransaction) return;
    try {
      setEditSubmitting(true);
      const res = await api.put(`/transactions/${editTransaction._id}`, payload);
      setTransactions((prev) => prev.map((t) => (t._id === res.data._id ? res.data : t)));
      window.dispatchEvent(new Event("finance-data-changed"));
      toast.success("Transaction updated");
      closeEdit();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Failed to update");
      toast.error("Update failed");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = (id) => setDeleteConfirm(id);

  const confirmDelete = async () => {
    try {
      await api.delete(`/transactions/${deleteConfirm}`);
      toast.success("Deleted");
      fetchTransactions();
      window.dispatchEvent(new Event("finance-data-changed"));
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const bulkDelete = async () => {
    if (!selected.length) return;
    try {
      await transactionApi.bulkDelete(selected);
      toast.success(`${selected.length} deleted`);
      setSelected([]);
      setSelectionMode(false);
      fetchTransactions();
      window.dispatchEvent(new Event("finance-data-changed"));
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const bulkCategoryUpdate = async () => {
    if (!selected.length || !bulkCategoryId) return;
    try {
      await transactionApi.bulkCategory(selected, bulkCategoryId);
      toast.success("Categories updated");
      setBulkCategoryOpen(false);
      setSelected([]);
      setSelectionMode(false);
      fetchTransactions();
    } catch {
      toast.error("Update failed");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Track income, expenses, and loan activity"
        icon={ClipboardList}
        action={
          <Button onClick={() => navigate("/transactions/new")}>
            <BadgeIndianRupee size={18} /> Add
          </Button>
        }
      />

      <Card>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Income", value: formatINR(totals.income), color: "text-emerald-600" },
            { label: "Expense", value: formatINR(totals.expense), color: "text-red-500" },
            { label: "Balance", value: formatINR(totals.balance), color: "text-[var(--app-text)]" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-xl bg-[var(--app-bg)]">
              <p className="text-[10px] text-[var(--app-text-muted)]">{s.label}</p>
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]" />
            <input
              type="search"
              placeholder="Search notes, categories..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] text-sm"
            />
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}><Filter size={16} /> Filters</Button>
        </div>

        {showFilters ? (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-[var(--app-bg)]">
            <Input label="From" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <Input label="To" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            <Input label="Min ₹" type="number" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setPage(1); }} />
            <Input label="Max ₹" type="number" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }} />
            <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="amount_desc">Highest amount</option>
              <option value="amount_asc">Lowest amount</option>
            </Select>
            <Select label="Category" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {["all", "income", "expense"].map((f) => (
            <Pill key={f} active={filterType === f} onClick={() => { setFilterType(f); setPage(1); }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Pill>
          ))}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setSelectionMode(!selectionMode); setSelected([]); }}>
              {selectionMode ? "Cancel" : "Select"}
            </Button>
            <Button size="sm" variant="secondary" onClick={async () => { const data = await fetchAllForExport(); exportTransactionsCSV(data); }}>
              CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={async () => { const data = await fetchAllForExport(); exportTransactionsExcel(data); }}>
              Excel
            </Button>
            <Button size="sm" variant="secondary" onClick={async () => { const data = await fetchAllForExport(); exportTransactionsPDF(data); }}>
              <Download size={14} /> PDF
            </Button>
          </div>
        </div>

        {selectionMode && selected.length > 0 ? (
          <div className="mt-3 flex gap-2 p-3 rounded-xl bg-[var(--app-primary)]/10">
            <span className="text-sm font-medium text-[var(--app-text)] self-center">{selected.length} selected</span>
            <Button size="sm" variant="danger" onClick={bulkDelete}>Delete</Button>
            <Button size="sm" variant="secondary" onClick={() => { setBulkCategoryOpen(true); if (!categories.length) fetchCategories(); }}>Change Category</Button>
          </div>
        ) : null}
      </Card>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No transactions" description="Add your first transaction to start tracking." actionLabel="Add Transaction" onAction={() => navigate("/transactions/new")} />
      ) : (
        <div className="space-y-3">
          {transactions.map((txn) => (
            <SwipeTransactionCard
              key={txn._id}
              txn={txn}
              isLoanTxn={isLoanTxn}
              selected={selected.includes(txn._id)}
              onSelect={toggleSelect}
              selectionMode={selectionMode}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {total > limit ? (
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-[var(--app-text-muted)]">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      ) : null}

      <EditTransactionModal open={isEditOpen} onClose={closeEdit} editTransaction={editTransaction} categories={categories} categoriesLoading={categoriesLoading} submitting={editSubmitting} error={editError} onSubmit={submitEdit} />

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={confirmDelete} title="Delete Transaction" message="This action cannot be undone." confirmLabel="Delete" />

      <Modal open={bulkCategoryOpen} onClose={() => setBulkCategoryOpen(false)} title="Bulk Category Update" size="sm">
        <Select label="New Category" value={bulkCategoryId} onChange={(e) => setBulkCategoryId(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.type})</option>)}
        </Select>
        <Button className="w-full mt-4" onClick={bulkCategoryUpdate}>Update {selected.length} transactions</Button>
      </Modal>
    </div>
  );
};

export default Transactions;
