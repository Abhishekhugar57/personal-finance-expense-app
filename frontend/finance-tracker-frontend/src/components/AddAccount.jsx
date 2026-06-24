import React, { useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Card, Button, Input, Select, PageHeader } from "./ui";
import { Wallet } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "BANK", label: "Bank Account" },
  { value: "CASH", label: "Cash" },
  { value: "WALLET", label: "Wallet" },
  { value: "UPI", label: "UPI" },
  { value: "CREDIT", label: "Credit Card" },
];

const AddAccount = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", type: "BANK", balance: 0 });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Account name is required";
    if (Number(form.balance) < 0) e.balance = "Balance cannot be negative";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      await api.post("/account", { ...form, balance: Number(form.balance) });
      toast.success("Account created");
      window.dispatchEvent(new Event("finance-data-changed"));
      navigate("/accounts");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Add Account" subtitle="Create a new financial account" icon={Wallet} />
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Account Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="HDFC Savings" />
          <Select label="Account Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input label="Initial Balance (₹)" type="number" min="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} error={errors.balance} />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/accounts")}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Save Account</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddAccount;
