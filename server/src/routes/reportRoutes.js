import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  downloadCsvReport,
  downloadPdfReport,
  emailPdfReport,
} from "../controllers/reportController.js";


const router = Router();

router.use(protect);

router.get("/csv", downloadCsvReport);
router.get("/pdf", downloadPdfReport);
router.post("/email", emailPdfReport);

export default router;