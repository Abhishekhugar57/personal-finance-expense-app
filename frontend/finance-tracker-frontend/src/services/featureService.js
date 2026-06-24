import api from "../api/client";

export const budgetApi = {
  list: (month) => api.get("/budgets", { params: { month } }),
  tracking: (month) => api.get("/budgets/tracking", { params: { month } }),
  create: (data) => api.post("/budgets", data),
  update: (id, data) => api.patch(`/budgets/${id}`, data),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const goalApi = {
  list: () => api.get("/goals"),
  create: (data) => api.post("/goals", data),
  update: (id, data) => api.patch(`/goals/${id}`, data),
  remove: (id) => api.delete(`/goals/${id}`),
};

export const recurringApi = {
  list: () => api.get("/recurring"),
  create: (data) => api.post("/recurring", data),
  update: (id, data) => api.patch(`/recurring/${id}`, data),
  remove: (id) => api.delete(`/recurring/${id}`),
};

export const notificationApi = {
  list: () => api.get("/notifications"),
  create: (data) => api.post("/notifications", data),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
  remove: (id) => api.delete(`/notifications/${id}`),
};

export const reportApi = {
  summary: (period) => api.get("/reports/summary", { params: { period } }),
};

export const accountApi = {
  transfer: (data) => api.post("/account/transfer", data),
  history: (id) => api.get(`/account/${id}/history`),
};

export const transactionApi = {
  bulkDelete: (ids) => api.delete("/transactions/bulk", { data: { ids } }),
  bulkCategory: (ids, category_id) =>
    api.patch("/transactions/bulk-category", { data: { ids, category_id } }),
};
