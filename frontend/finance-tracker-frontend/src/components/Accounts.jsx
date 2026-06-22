import React, { useEffect, useState } from "react";
import api from "../api/client";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/get/account");
      const accountsData = res.data?.data || res.data || [];
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      console.error("Error fetching accounts", err);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const handleFinanceRefresh = () => fetchAccounts();
    window.addEventListener("finance-data-changed", handleFinanceRefresh);
    return () => {
      window.removeEventListener("finance-data-changed", handleFinanceRefresh);
    };
  }, []);

  const deleteAccount = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;

    const previousAccounts = accounts;
    setDeletingId(id);
    setAccounts((prev) => prev.filter((account) => account._id !== id));

    try {
      await api.delete(`/accountdelete/${id}`);
      toast.success("Account deleted");
      window.dispatchEvent(new Event("finance-data-changed"));
    } catch (err) {
      setAccounts(previousAccounts);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to delete account";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full px-3 py-3 sm:px-3 sm:py-3 md:px-6 md:py-6 pb-24 overflow-x-hidden">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 leading-tight">
          Accounts
        </h1>

        <button
          onClick={() => navigate("/accounts/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm text-sm"
        >
          + Add Account
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-10 text-center">
          <p className="text-gray-500 text-lg">No accounts found</p>
          <p className="text-gray-400 text-sm mt-1">
            Add your first account to start tracking finances
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((account) => (
            <div
              key={account._id}
              className="bg-white border border-gray-100 rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all p-4 md:p-5 relative"
            >
              <button
                type="button"
                onClick={() => deleteAccount(account._id)}
                disabled={deletingId === account._id}
                aria-label={`Delete ${account.name}`}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>

              <h2 className="text-lg font-semibold text-gray-800 pr-8">
                {account.name}
              </h2>

              <p className="text-sm text-gray-500 mt-1">{account.type} Account</p>

              <p className="text-3xl font-bold text-green-600 mt-4">
                ₹{account.balance}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Currency: {account.currency}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Accounts;
