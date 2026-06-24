import React, { useEffect, useMemo, useState } from "react";
import { Landmark, Plus, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";

import {
  addLoan,
  deleteLoan,
  getAccounts,
  getLoans,
  repayLoan,
  updateLoan,
} from "../services/loanService";
import EmptyState from "./loans/EmptyState";
import LoanCard from "./loans/LoanCard";
import LoanFormModal from "./loans/LoanFormModal";
import LoadingSpinner from "./loans/LoadingSpinner";
import RepayLoanModal from "./loans/RepayLoanModal";
import SummaryCard from "./loans/SummaryCard";
import { EMICalculatorButton } from "./loans/EMICalculator";

const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | paid | unpaid

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add | edit
  const [activeLoan, setActiveLoan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [repayLoanItem, setRepayLoanItem] = useState(null);

  const fetchAll = async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const [loansRes, accountsRes] = await Promise.all([
        getLoans(),
        getAccounts(),
      ]);
      setLoans(loansRes);
      setAccounts(accountsRes);
    } catch (e) {
      console.error("Loans fetch error:", e);
      toast.error(e?.message || "Failed to load loans");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const derived = useMemo(() => {
    const isPaid = (l) =>
      l.status === "CLOSED" || Number(l.outstandingAmount) === 0;

    const borrowedLoans = loans.filter((l) => l.type === "TAKEN");
    const totalLoans = loans.length;
    const totalBorrowed = borrowedLoans.reduce(
      (sum, l) => sum + Number(l.principalAmount || 0),
      0
    );
    const totalRemaining = borrowedLoans.reduce(
      (sum, l) => sum + Number(l.outstandingAmount || 0),
      0
    );
    const totalRepaid = borrowedLoans.reduce(
      (sum, l) =>
        sum +
        (Number(l.principalAmount || 0) - Number(l.outstandingAmount || 0)),
      0
    );

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = loans
      .filter((l) => {
        if (!normalizedQuery) return true;
        const hay = `${l.personName || ""} ${l.type || ""} ${
          l.accountId?.name || ""
        } ${l.status || ""}`.toLowerCase();
        return hay.includes(normalizedQuery);
      })
      .filter((l) => {
        if (filter === "paid") return isPaid(l);
        if (filter === "unpaid") return !isPaid(l);
        return true;
      });

    return {
      totalLoans,
      totalBorrowed,
      totalRemaining,
      totalRepaid,
      visibleLoans: filtered,
    };
  }, [loans, query, filter]);

  const openAdd = () => {
    setModalMode("add");
    setActiveLoan(null);
    setModalOpen(true);
  };

  const openEdit = (loan) => {
    setModalMode("edit");
    setActiveLoan(loan);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const submitModal = async (payload) => {
    setSubmitting(true);
    try {
      if (modalMode === "add") {
        await addLoan(payload);
        toast.success("Loan added");
      } else {
        await updateLoan(activeLoan?._id, payload);
        toast.success("Loan updated");
      }
      setModalOpen(false);
      await fetchAll({ silent: true });
    } catch (e) {
      console.error("Loan save error:", e);
      toast.error(e?.message || "Failed to save loan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (loan) => {
    const ok = window.confirm(
      `Delete "${loan.personName}"? This can't be undone.`
    );
    if (!ok) return;

    try {
      toast.loading("Deleting...", { id: "delete-loan" });
      await deleteLoan(loan._id);
      toast.success("Loan deleted", { id: "delete-loan" });
      await fetchAll({ silent: true });
    } catch (e) {
      console.error("Loan delete error:", e);
      toast.error(e?.message || "Failed to delete loan", { id: "delete-loan" });
    }
  };

  const openRepay = (loan) => {
    setRepayLoanItem(loan);
    setRepayOpen(true);
  };

  const closeRepay = () => {
    if (submitting) return;
    setRepayOpen(false);
    setRepayLoanItem(null);
  };

  const submitRepay = async (amount) => {
    setSubmitting(true);
    try {
      await repayLoan(repayLoanItem._id, amount);
      toast.success("Payment recorded");
      setRepayOpen(false);
      setRepayLoanItem(null);
      await fetchAll({ silent: true });
    } catch (e) {
      console.error("Repayment error:", e);
      toast.error(e?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-3 py-3 sm:px-3 sm:py-3 md:px-6 md:py-6 space-y-4 md:space-y-6 overflow-x-hidden pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Landmark size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
              Loans
            </h1>
            <p className="text-sm text-gray-500">
              Track borrowed money, repayments, and remaining balance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EMICalculatorButton />
          <button
            onClick={() => fetchAll({ silent: true })}
            className="h-10 w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition flex items-center justify-center"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={18} /> Add Loan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard
          title="Total loans"
          value={derived.totalLoans.toLocaleString()}
          tone="slate"
        />
        <SummaryCard
          title="Total borrowed"
          value={formatINR(derived.totalBorrowed)}
          tone="blue"
        />
        <SummaryCard
          title="Total repaid"
          value={formatINR(derived.totalRepaid)}
          tone="green"
        />
        <SummaryCard
          title="Remaining balance"
          value={formatINR(derived.totalRemaining)}
          tone="amber"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl shadow-sm p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search loans…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                filter === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unpaid")}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                filter === "unpaid"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                filter === "paid"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Paid
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching loans..." />
      ) : derived.visibleLoans.length === 0 ? (
        <EmptyState
          title={loans.length === 0 ? "No loans yet" : "No matching loans"}
          description={
            loans.length === 0
              ? "Add your first loan to start tracking repayments."
              : "Try changing filters or search terms."
          }
          action={
            loans.length === 0 ? (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
              >
                <Plus size={18} /> Add Loan
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-5">
          {derived.visibleLoans.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRepay={openRepay}
            />
          ))}
        </div>
      )}

      <LoanFormModal
        open={modalOpen}
        mode={modalMode}
        initialLoan={activeLoan}
        accounts={accounts}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={submitModal}
      />

      <RepayLoanModal
        open={repayOpen}
        loan={repayLoanItem}
        submitting={submitting}
        onClose={closeRepay}
        onSubmit={submitRepay}
      />
    </div>
  );
};

export default Loans;
