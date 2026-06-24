import React, { useState } from "react";
import { Calculator } from "lucide-react";
import { Modal, Input, Card } from "../ui";
import { formatINR } from "../../utils/format";

const EMICalculator = ({ open, onClose }) => {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");

  const p = Number(principal) || 0;
  const r = (Number(rate) || 0) / 12 / 100;
  const n = Number(tenure) || 0;

  const emi = r > 0 && n > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / (n || 1);
  const total = emi * n;
  const interest = total - p;

  return (
    <Modal open={open} onClose={onClose} title="EMI Calculator" description="Calculate monthly loan payments">
      <div className="space-y-4">
        <Input label="Loan Amount (₹)" type="number" min="1" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        <Input label="Annual Interest Rate (%)" type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        <Input label="Tenure (months)" type="number" min="1" value={tenure} onChange={(e) => setTenure(e.target.value)} />
        {p > 0 && n > 0 ? (
          <Card padding="p-4" className="!bg-[var(--app-bg)]">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-[var(--app-text-muted)]">Monthly EMI</p>
                <p className="text-lg font-bold text-[var(--app-primary)]">{formatINR(emi)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--app-text-muted)]">Total Interest</p>
                <p className="text-lg font-bold text-amber-600">{formatINR(interest)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--app-text-muted)]">Total Payment</p>
                <p className="text-lg font-bold text-[var(--app-text)]">{formatINR(total)}</p>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </Modal>
  );
};

export const EMICalculatorButton = ({ className }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--app-border)] text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--app-surface-elevated)] transition"}
      >
        <Calculator size={18} /> EMI Calculator
      </button>
      <EMICalculator open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default EMICalculator;
