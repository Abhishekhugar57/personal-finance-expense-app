import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Target } from "lucide-react";
import { goalApi } from "../services/featureService";
import { Card, Button, PageHeader, EmptyState, Modal, Input, Badge } from "./ui";
import { formatINR, formatDate, toDateInputValue } from "../utils/format";

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalApi.list();
      setGoals(res.data || []);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await goalApi.create({
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount || 0),
        deadline: form.deadline || undefined,
      });
      toast.success("Goal created");
      setModalOpen(false);
      setForm({ name: "", targetAmount: "", currentAmount: "0", deadline: "" });
      fetchGoals();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  };

  const addFunds = async (goal, amount) => {
    const newAmount = Number(goal.currentAmount) + Number(amount);
    try {
      await goalApi.update(goal._id, { currentAmount: newAmount });
      toast.success("Progress updated");
      fetchGoals();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    await goalApi.remove(id);
    toast.success("Goal deleted");
    fetchGoals();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Savings Goals" subtitle="Track progress toward your targets" icon={Target} action={<Button onClick={() => setModalOpen(true)}><Plus size={18} /> New Goal</Button>} />

      {loading ? (
        <p className="text-[var(--app-text-muted)]">Loading...</p>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="No savings goals" description="Set a target and track your progress." actionLabel="Create Goal" onAction={() => setModalOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            return (
              <Card key={goal._id}>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-[var(--app-text)]">{goal.name}</h3>
                  <Badge tone={goal.status === "completed" ? "success" : "primary"}>{goal.status}</Badge>
                </div>
                {goal.deadline ? <p className="text-xs text-[var(--app-text-muted)] mt-1">Due {formatDate(goal.deadline)}</p> : null}
                <div className="mt-4 h-3 rounded-full bg-[var(--app-border)] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                  {formatINR(goal.currentAmount)} of {formatINR(goal.targetAmount)} ({percent.toFixed(0)}%)
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { const amt = prompt("Add amount (₹):"); if (amt) addFunds(goal, amt); }}>Add Funds</Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(goal._id)}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Savings Goal">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Goal Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Target Amount (₹)" type="number" required min="1" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
          <Input label="Current Amount (₹)" type="number" min="0" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Button type="submit" className="w-full" loading={submitting}>Create Goal</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Goals;
