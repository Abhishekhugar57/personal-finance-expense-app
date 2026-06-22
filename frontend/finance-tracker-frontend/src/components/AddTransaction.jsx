import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AddTransaction = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [accountsError, setAccountsError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");

  const [formData, setFormData] = useState({
    account_id: "",
    category_id: "",
    amount: "",
    type: "expense",
    note: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const fetchAccounts = async () => {
    try {
      setAccountsError("");
      const res = await api.get("/get/account");
      const accountsData = res.data?.data || res.data || [];
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to fetch accounts.";
      setAccountsError(message);
      toast.error(message);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesError("");
      const res = await api.get("/get/categories");
      const categoriesData = res.data?.data || res.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load categories.";
      setCategoriesError(message);
      toast.error(message);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "type" ? { category_id: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/transactions", formData);
      window.dispatchEvent(new Event("finance-data-changed"));
      toast.success("Transaction added");
      navigate("/transactions");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(
    () => categories.filter((cat) => cat.type === formData.type),
    [categories, formData.type]
  );

  return (
    <div className="w-full px-3 py-3 sm:px-3 sm:py-3 md:px-6 md:py-6 pb-24 max-w-2xl mx-auto overflow-x-hidden">
      <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 leading-tight">
        Add Transaction
      </h1>

      {fetchingData ? (
        <p className="text-sm text-gray-600">Loading accounts and categories...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl shadow space-y-3 md:space-y-4"
        >
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
                    {acc.name || "Unnamed Account"} ({acc.type || "N/A"}) - ₹
                    {acc.balance ?? 0}
                  </option>
                ))
              ) : (
                <option disabled>No accounts found</option>
              )}
            </select>
            {accountsError ? (
              <p className="mt-1 text-sm text-red-600">{accountsError}</p>
            ) : null}
          </div>

          <div>
            <label className="block mb-1 font-medium">Select Category</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              disabled={filteredCategories.length === 0}
              className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {filteredCategories.length
                  ? "Choose category"
                  : "No categories available"}
              </option>
              {filteredCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name || "Unnamed Category"}
                </option>
              ))}
            </select>
            {categoriesError ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm text-red-600">{categoriesError}</p>
                <button
                  type="button"
                  onClick={fetchCategories}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : null}
            {!categoriesError && filteredCategories.length === 0 ? (
              <p className="mt-1 text-sm text-amber-600">
                No categories found for this type. Try switching income/expense or
                retry loading.
              </p>
            ) : null}
          </div>

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
              disabled={loading || filteredCategories.length === 0}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
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
