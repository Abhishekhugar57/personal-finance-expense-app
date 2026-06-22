import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddTransaction = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [formData, setFormData] = useState({
    account_id: "",
    category_id: "",
    amount: "",
    type: "expense",
    note: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  // ================= FETCH ACCOUNTS =================
  const fetchAccounts = async () => {
    try {
      const res = await axios.get("/api/get/account", {
        withCredentials: true,
      });

      const accountsData = res.data.data || res.data || [];
      setAccounts(accountsData);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      alert("Failed to fetch accounts.");
    }
  };

  // ================= FETCH CATEGORIES =================
  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/get/categories", {
        withCredentials: true,
      });

      const categoriesData = res.data.data || res.data || [];
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setFetchingData(true);
      await Promise.all([fetchAccounts(), fetchCategories()]);
      setFetchingData(false);
    };
    fetchAll();
  }, []);

  // ================= HANDLE INPUT CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= SUBMIT FORM =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      await axios.post("/api/transactions", formData, {
        withCredentials: true,
      });

      window.dispatchEvent(new Event("finance-data-changed"));
      navigate("/transactions");
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <div className="w-full px-3 py-3 sm:px-3 sm:py-3 md:px-6 md:py-6 pb-24 max-w-2xl mx-auto overflow-x-hidden">
      <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 leading-tight">
        Add Transaction
      </h1>

      {fetchingData ? (
        <p>Loading accounts and categories...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow space-y-3 md:space-y-4"
        >
          {/* Transaction Type */}
          <div>
            <label className="block mb-1 font-medium">Transaction Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block mb-1 font-medium">Select Account</label>
            <select
              name="account_id"
              value={formData.account_id}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an account</option>

              {accounts.length > 0 ? (
                accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name || acc.accountName || "Unnamed Account"} (
                    {acc.type || acc.accountType || "N/A"}) - ₹
                    {acc.balance ?? 0}
                  </option>
                ))
              ) : (
                <option disabled>No accounts found</option>
              )}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block mb-1 font-medium">Select Category</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose category</option>

              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name || "Unnamed Category"}
                  </option>
                ))
              ) : (
                <option disabled>No categories for this type</option>
              )}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-1 font-medium">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="1"
              className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block mb-1 font-medium">Transaction Date</label>
            <input
              type="date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block mb-1 font-medium">Note (Optional)</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a short description..."
            />
          </div>

          {/* Buttons Section */}
          <div className="flex flex-col gap-3 pt-3 border-t mt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/transactions")}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {loading ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddTransaction;
