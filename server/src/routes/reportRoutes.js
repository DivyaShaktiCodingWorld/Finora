import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  downloadCsvReport,
  downloadPdfReport,
} from "../controllers/reportController.js";

const router = Router();

// All report routes require authentication
router.use(protect);

// Read-only downloads (same protection level as the expense read endpoints)
router.get("/csv", downloadCsvReport);
router.get("/pdf", downloadPdfReport);

export default router;