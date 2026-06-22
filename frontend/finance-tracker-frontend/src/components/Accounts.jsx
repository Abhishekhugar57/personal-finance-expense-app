import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    try {
      const res = await axios.get("/api/get/account", {
        withCredentials: true,
      });

      setAccounts(res.data);
    } catch (err) {
      console.error("Error fetching accounts", err);
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
    if (!window.confirm("Are you sure you want to delete this account?"))
      return;

    try {
      await axios.delete(`/api/accountdelete/${id}`, {
        withCredentials: true,
      });

      fetchAccounts();
      window.dispatchEvent(new Event("finance-data-changed"));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="w-full px-3 py-3 sm:px-3 sm:py-3 md:px-6 md:py-6 pb-24 overflow-x-hidden">
      {/* Header */}
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

      {/* Empty State */}
      {accounts.length === 0 ? (
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
              {/* Delete Button */}
              <button
                onClick={() => deleteAccount(account._id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>

              {/* Account Name */}
              <h2 className="text-lg font-semibold text-gray-800">
                {account.name}
              </h2>

              {/* Account Type */}
              <p className="text-sm text-gray-500 mt-1">
                {account.type} Account
              </p>

              {/* Balance */}
              <p className="text-3xl font-bold text-green-600 mt-4">
                ₹{account.balance}
              </p>

              {/* Currency */}
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
