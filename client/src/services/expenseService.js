import api from "../lib/api";

const expenseService = {
  async getExpenses(params = {}) {
    const response = await api.get("/expenses", { params });
    return response.data;
  },

  async getExpenseSummary(params = {}) {
    const response = await api.get("/expenses/summary", { params });
    return response.data;
  },

  async getExpenseAnalytics(params = {}) {
    const response = await api.get("/expenses/analytics", { params });
    return response.data;
  },

  async getExpenseById(id) {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async createExpense(payload) {
    const response = await api.post("/expenses", payload);
    return response.data;
  },

  async updateExpense(id, payload) {
    const response = await api.put(`/expenses/${id}`, payload);
    return response.data;
  },

  async deleteExpense(id) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

export default expenseService;
