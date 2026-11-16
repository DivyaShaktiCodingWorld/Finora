import api from "../lib/api";

const budgetService = {
  async getCurrentBudget() {
    const response = await api.get("/budget/current");
    return response.data;
  },

  async updateBudgetSettings(payload) {
    const response = await api.post("/budget/settings", payload);
    return response.data;
  },

  async setMonthSalary(payload) {
    const response = await api.post("/budget/month-salary", payload);
    return response.data;
  },

  async toggleFixedExpense(fixedExpenseId, isPaid) {
    const response = await api.post("/budget/toggle-fixed-expense", {
      fixedExpenseId,
      isPaid,
    });
    return response.data;
  },

  async getFixedExpenses() {
    const response = await api.get("/budget/fixed-expenses");
    return response.data;
  },

  async createFixedExpense(payload) {
    const response = await api.post("/budget/fixed-expenses", payload);
    return response.data;
  },

  async updateFixedExpense(id, payload) {
    const response = await api.put(`/budget/fixed-expenses/${id}`, payload);
    return response.data;
  },

  async deleteFixedExpense(id) {
    const response = await api.delete(`/budget/fixed-expenses/${id}`);
    return response.data;
  },

  async dismissNotification(notificationId) {
    const response = await api.post("/budget/dismiss-notification", {
      notificationId,
    });
    return response.data;
  },

  async getMonthlySavingsHistory(params = {}) {
    const response = await api.get("/budget/savings-history", { params });
    return response.data;
  },
};

export default budgetService;
