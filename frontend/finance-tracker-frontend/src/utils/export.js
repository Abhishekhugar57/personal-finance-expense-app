import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatINR, formatDate } from "./format";

const txnRow = (txn) => ({
  Date: formatDate(txn.transaction_date),
  Type: txn.type,
  Category: txn.category_id?.name || "—",
  Amount: Number(txn.amount || 0),
  Note: txn.note || "",
});

export const exportTransactionsCSV = (transactions, filename = "transactions") => {
  if (!transactions?.length) return;
  const rows = transactions.map(txnRow);
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportTransactionsExcel = (transactions, filename = "transactions") => {
  if (!transactions?.length) return;
  const rows = transactions.map(txnRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportTransactionsPDF = (transactions, filename = "transactions") => {
  if (!transactions?.length) return;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Transaction Report", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 28);
  autoTable(doc, {
    startY: 35,
    head: [["Date", "Type", "Category", "Amount", "Note"]],
    body: transactions.map((t) => [
      formatDate(t.transaction_date),
      t.type,
      t.category_id?.name || "—",
      formatINR(t.amount),
      t.note || "",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  doc.save(`${filename}.pdf`);
};
