import api from "../api/client";

function normalizeError(error) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong";
  const status = error?.response?.status;
  return { message, status, raw: error };
}

export async function getLoans() {
  try {
    const res = await api.get("/get/loan");
    return res.data ?? [];
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function addLoan(payload) {
  try {
    const res = await api.post("/loan", payload);
    return res.data?.loan ?? res.data;
  } catch (e) {
    throw normalizeError(e);
  }
}

// Backend route added: PATCH /loan/:id
export async function updateLoan(id, payload) {
  try {
    const res = await api.patch(`/loan/${id}`, payload);
    return res.data?.loan ?? res.data;
  } catch (e) {
    throw normalizeError(e);
  }
}

// Backend route added: DELETE /loan/:id
export async function deleteLoan(id) {
  try {
    const res = await api.delete(`/loan/${id}`);
    return res.data;
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function getAccounts() {
  try {
    const res = await api.get("/get/account");
    return res.data ?? [];
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function repayLoan(id, amount) {
  try {
    const res = await api.post(`/loan/${id}/payment`, { amount });
    return res.data?.loan ?? res.data;
  } catch (e) {
    throw normalizeError(e);
  }
}

