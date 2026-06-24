import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, PiggyBank } from "lucide-react";
import { budgetApi } from "../services/featureService";
import api from "../api/client";
import { Card, Button, PageHeader, EmptyState, Modal, Input, Select, Badge } from "./ui";
import { formatINR } from "../utils/format";

const currentMonth = () => new Date().toISOString().slice(0, 7);

const Budgets = () => {
  const [tracking, setTracking] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", amount: "", categoryId: "", alertThreshold: 80 });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trackRes, catRes] = await Promise.all([
        budgetApi.tracking(month),
        api.get("/get/categories"),
      ]);
      setTracking(trackRes.data?.tracking || []);
      setCategories((catRes.data?.data || catRes.data || []).filter((c) => c.type === "expense"));
    } catch {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await budgetApi.create({ ...form, amount: Number(form.amount), month, categoryId: form.categoryId || null });
      toast.success("Budget created");
      setModalOpen(false);
      setForm({ name: "", amount: "", categoryId: "", alertThreshold: 80 });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await budgetApi.remove(id);
      toast.success("Budget deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Budgets"
        subtitle="Track monthly spending limits"
        icon={PiggyBank}
        action={
          <div className="flex gap-2">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 py-2 text-sm" />
            <Button onClick={() => setModalOpen(true)}><Plus size={18} /> Add</Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-[var(--app-text-muted)]">Loading...</p>
      ) : tracking.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No budgets set" description="Create a monthly budget to track your spending." actionLabel="Add Budget" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-4">
          {tracking.map(({ budget, spent, remaining, percent, alert }) => (
            <Card key={budget._id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--app-text)]">{budget.name}</h3>
                  {budget.categoryId?.name ? <Badge tone="neutral" className="mt-1">{budget.categoryId.name}</Badge> : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--app-text)]">{formatINR(spent)} / {formatINR(budget.amount)}</p>
                  {alert ? <Badge tone="warning" className="mt-1">Alert</Badge> : null}
                </div>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-[var(--app-border)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${percent >= 100 ? "bg-red-500" : alert ? "bg-amber-500" : "bg-[var(--app-primary)]"}`}
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-[var(--app-text-muted)]">
                <span>{percent.toFixed(0)}% used</span>
                <span>{formatINR(remaining)} left</span>
              </div>
              <Button variant="ghost" size="sm" className="mt-3 !min-h-0 !px-2 !py-1 text-xs text-red-500" onClick={() => handleDelete(budget._id)}>Delete</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Budget" description="Set a monthly spending limit">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Amount (₹)" type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select label="Category (optional)" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">All expenses</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Input label="Alert at %" type="number" min="1" max="100" value={form.alertThreshold} onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })} />
          <Button type="submit" className="w-full" loading={submitting}>Create Budget</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;
