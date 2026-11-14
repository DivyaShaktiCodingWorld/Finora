
import api from "../lib/api";

const authService = {
  async register(payload) {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  async login(payload) {
    const response = await api.post("/auth/login", payload);
    return response.data;
  },

  async logout() {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export default authService;
