
import api from "../lib/api";

const reportService = {
  // Download PDF or CSV
  async downloadReport(format, params = {}) {
    const response = await api.get(`/reports/${format}`, {
      params,
      responseType: "blob",
    });

    return response.data;
  },

  // Email PDF report
  async emailPdfReport(params = {}) {
    const response = await api.post("/reports/email", params);
    return response.data;
  },
};

export default reportService;
