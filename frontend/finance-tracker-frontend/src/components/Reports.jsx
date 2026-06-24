import React, { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { reportApi } from "../services/featureService";
import { Card, Button, PageHeader, Pill } from "./ui";
import { formatINR } from "../utils/format";

const Reports = () => {
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await reportApi.summary(period);
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [period]);

  const handlePrint = () => window.print();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Reports" subtitle="Financial summaries and insights" icon={FileText} action={<Button variant="secondary" onClick={handlePrint}><Download size={18} /> Export PDF</Button>} />

      <div className="flex gap-2 flex-wrap">
        {["weekly", "monthly", "yearly"].map((p) => (
          <Pill key={p} active={period === p} onClick={() => setPeriod(p)}>{p.charAt(0).toUpperCase() + p.slice(1)}</Pill>
        ))}
      </div>

      {loading ? (
        <p className="text-[var(--app-text-muted)]">Generating report...</p>
      ) : !data ? (
        <Card><p className="text-center text-[var(--app-text-muted)]">No data for this period</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Income", value: formatINR(data.income), color: "text-emerald-600" },
              { label: "Expenses", value: formatINR(data.expense), color: "text-red-500" },
              { label: "Savings", value: formatINR(data.savings), color: data.savings >= 0 ? "text-emerald-600" : "text-red-500" },
              { label: "Transactions", value: data.transactionCount, color: "text-[var(--app-text)]" },
            ].map((item) => (
              <Card key={item.label} padding="p-4">
                <p className="text-xs text-[var(--app-text-muted)]">{item.label}</p>
                <p className={`mt-1 text-xl font-bold ${item.color}`}>{item.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="font-semibold text-[var(--app-text)] mb-4">Category Report</h3>
            {data.categoryBreakdown?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.categoryBreakdown} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--app-chart-grid)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatINR(v)} />
                    <Bar dataKey="amount" fill="#4F46E5" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <ul className="mt-4 space-y-2">
                  {data.categoryBreakdown.map((c) => (
                    <li key={c.category} className="flex justify-between text-sm">
                      <span className="text-[var(--app-text)]">{c.category}</span>
                      <span className="font-semibold">{formatINR(c.amount)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-[var(--app-text-muted)] text-sm">No category data</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;
