import React, { useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

const AddAccount = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    type: "BANK",
    balance: 0,
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/account", form);

      alert("Account created successfully");

      navigate("/accounts"); // go back to accounts page
    } catch (err) {
      console.error(err);
      alert("Failed to create account");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white shadow-md rounded-xl p-4 sm:p-6 mt-4 sm:mt-6 overflow-x-hidden">
      <h2 className="text-xl font-semibold mb-6">Add Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Account Name</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="HDFC Bank"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Account Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="WALLET">Wallet</option>
            <option value="CREDIT">Credit Card</option>
          </select>
        </div>

        {/* Balance */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Initial Balance
          </label>
          <input
            type="number"
            name="balance"
            value={form.balance}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/accounts")}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAccount;
