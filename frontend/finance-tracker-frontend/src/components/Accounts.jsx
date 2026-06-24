import React, { useEffect, useState } from "react";
import api from "../api/client";
import toast from "react-hot-toast";
import { Wallet, Building2, Banknote, CreditCard, Smartphone, Plus, Pencil, ArrowLeftRight, History, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { accountApi } from "../services/featureService";
import { Card, Button, PageHeader, EmptyState, Modal, Input, Select, Badge } from "./ui";
import { formatINR, formatDate } from "../utils/format";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const typeConfig = {
  BANK: { icon: Building2, label: "Bank", color: "from-blue-500 to-indigo-600" },
  CASH: { icon: Banknote, label: "Cash", color: "from-emerald-500 to-teal-600" },
  WALLET: { icon: Wallet, label: "Wallet", color: "from-violet-500 to-purple-600" },
  CREDIT: { icon: CreditCard, label: "Credit", color: "from-amber-500 to-orange-600" },
  UPI: { icon: Smartphone, label: "UPI", color: "from-cyan-500 to-blue-600" },
};

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);
  const [history, setHistory] = useState([]);
  const [editForm, setEditForm] = useState({ name: "", type: "BANK" });
  const [transferForm, setTransferForm] = useState({ fromAccountId: "", toAccountId: "", amount: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/get/account");
      const data = res.data?.data || res.data || [];
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  useEffect(() => {
    const handler = () => fetchAccounts();
    window.addEventListener("finance-data-changed", handler);
    return () => window.removeEventListener("finance-data-changed", handler);
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  const deleteAccount = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/accountdelete/${id}`);
      toast.success("Account deleted");
      fetchAccounts();
      window.dispatchEvent(new Event("finance-data-changed"));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (account) => {
    setEditForm({ name: account.name, type: account.type });
    setEditModal(account);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.patch(`/account/${editModal._id}`, editForm);
      toast.success("Account updated");
      setEditModal(null);
      fetchAccounts();
    } catch {
      toast.error("Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await accountApi.transfer({ ...transferForm, amount: Number(transferForm.amount) });
      toast.success("Transfer completed");
      setTransferModal(false);
      setTransferForm({ fromAccountId: "", toAccountId: "", amount: "", note: "" });
      fetchAccounts();
      window.dispatchEvent(new Event("finance-data-changed"));
    } catch (err) {
      toast.error(err?.response?.data?.error || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  const viewHistory = async (account) => {
    try {
      const res = await accountApi.history(account._id);
      setHistory(res.data?.history || []);
      setHistoryModal(account);
    } catch {
      toast.error("Failed to load history");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Accounts"
        subtitle={`Total: ${formatINR(totalBalance)}`}
        icon={Wallet}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setTransferModal(true)}><ArrowLeftRight size={18} /> Transfer</Button>
            <Button onClick={() => navigate("/accounts/new")}><Plus size={18} /> Add</Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-[var(--app-text-muted)]">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="No accounts" description="Add your first account to start tracking." actionLabel="Add Account" onAction={() => navigate("/accounts/new")} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const config = typeConfig[account.type] || typeConfig.BANK;
            const Icon = config.icon;
            return (
              <Card key={account._id} hover className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`} />
                <div className="flex items-start justify-between gap-2">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${config.color} text-white flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <Badge tone="neutral">{config.label}</Badge>
                </div>
                <h3 className="mt-3 font-semibold text-[var(--app-text)]">{account.name}</h3>
                <p className="mt-2 text-2xl font-bold text-emerald-600">{formatINR(account.balance)}</p>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">{account.currency || "INR"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(account)}><Pencil size={14} /></Button>
                  <Button size="sm" variant="secondary" onClick={() => viewHistory(account)}><History size={14} /> History</Button>
                  <Button size="sm" variant="ghost" className="text-red-500" disabled={deletingId === account._id} onClick={() => deleteAccount(account._id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Account">
        <form onSubmit={saveEdit} className="space-y-4">
          <Input label="Name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Select label="Type" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
            {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Button type="submit" className="w-full" loading={submitting}>Save</Button>
        </form>
      </Modal>

      <Modal open={transferModal} onClose={() => setTransferModal(false)} title="Transfer Funds" description="Move money between accounts">
        <form onSubmit={handleTransfer} className="space-y-4">
          <Select label="From" required value={transferForm.fromAccountId} onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}>
            <option value="">Select account</option>
            {accounts.map((a) => <option key={a._id} value={a._id}>{a.name} ({formatINR(a.balance)})</option>)}
          </Select>
          <Select label="To" required value={transferForm.toAccountId} onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}>
            <option value="">Select account</option>
            {accounts.filter((a) => a._id !== transferForm.fromAccountId).map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </Select>
          <Input label="Amount (₹)" type="number" required min="1" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} />
          <Input label="Note" value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })} />
          <Button type="submit" className="w-full" loading={submitting}>Transfer</Button>
        </form>
      </Modal>

      <Modal open={!!historyModal} onClose={() => setHistoryModal(null)} title={`Balance History — ${historyModal?.name}`} size="lg">
        {history.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 10 }} width={50} />
                <Tooltip formatter={(v) => formatINR(v)} labelFormatter={(d) => formatDate(d)} />
                <Area type="monotone" dataKey="balance" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
            <ul className="mt-4 max-h-48 overflow-y-auto space-y-2">
              {[...history].reverse().slice(0, 10).map((h, i) => (
                <li key={i} className="flex justify-between text-sm border-b border-[var(--app-border)] pb-2">
                  <span className="text-[var(--app-text-muted)]">{formatDate(h.date)} · {h.note || h.category}</span>
                  <span className="font-semibold">{formatINR(h.balance)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[var(--app-text-muted)] text-center py-6">No transaction history</p>
        )}
      </Modal>
    </div>
  );
};

export default Accounts;
