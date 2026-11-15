import api from "../lib/api";

const reportService = {
  // format: "pdf" | "csv"
  async downloadReport(format, params = {}) {
    const response = await api.get(`/reports/${format}`, {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};

export default reportService;