import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Repeat } from "lucide-react";
import api from "../api/client";
import { recurringApi } from "../services/featureService";
import { Card, Button, PageHeader, EmptyState, Modal, Input, Select, Badge, Pill } from "./ui";
import { formatINR } from "../utils/format";

const Recurring = () => {
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", amount: "", type: "expense", categoryId: "", accountId: "", frequency: "monthly", dayOfMonth: 1, note: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [recRes, accRes, catRes] = await Promise.all([
        recurringApi.list(),
        api.get("/get/account"),
        api.get("/get/categories"),
      ]);
      setItems(recRes.data || []);
      setAccounts(accRes.data?.data || accRes.data || []);
      setCategories(catRes.data?.data || catRes.data || []);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await recurringApi.create({ ...form, amount: Number(form.amount) });
      toast.success("Recurring transaction added");
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item) => {
    await recurringApi.update(item._id, { isActive: !item.isActive });
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    await recurringApi.remove(id);
    toast.success("Deleted");
    fetchAll();
  };

  const filteredCats = categories.filter((c) => c.type === form.type);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Recurring" subtitle="Salary, rent, bills & subscriptions" icon={Repeat} action={<Button onClick={() => setModalOpen(true)}><Plus size={18} /> Add</Button>} />

      {loading ? (
        <p className="text-[var(--app-text-muted)]">Loading...</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Repeat} title="No recurring transactions" description="Track monthly salary, rent, and subscriptions." actionLabel="Add Recurring" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item._id} padding="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[var(--app-text)]">{item.name}</h3>
                    <Badge tone={item.type === "income" ? "success" : "danger"}>{item.type}</Badge>
                    {!item.isActive ? <Badge tone="neutral">Paused</Badge> : null}
                  </div>
                  <p className="text-xs text-[var(--app-text-muted)] mt-1">
                    {item.frequency} · {item.categoryId?.name} · {item.accountId?.name}
                  </p>
                </div>
                <p className={`text-lg font-bold shrink-0 ${item.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                  {item.type === "income" ? "+" : "-"}{formatINR(item.amount)}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => toggleActive(item)}>{item.isActive ? "Pause" : "Resume"}</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(item._id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Recurring Transaction">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Salary" />
          <div className="flex gap-2">
            <Pill active={form.type === "income"} onClick={() => setForm({ ...form, type: "income", categoryId: "" })}>Income</Pill>
            <Pill active={form.type === "expense"} onClick={() => setForm({ ...form, type: "expense", categoryId: "" })}>Expense</Pill>
          </div>
          <Input label="Amount (₹)" type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select label="Account" required value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
            <option value="">Select account</option>
            {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </Select>
          <Select label="Category" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Select category</option>
            {filteredCats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select label="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
          <Button type="submit" className="w-full" loading={submitting}>Save</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Recurring;
