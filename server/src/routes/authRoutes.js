
import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
  register,
  login,
  logout,
  refresh,
  getMe,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import {
  createCsrfToken,
  verifyCsrfToken,
} from "../middleware/csrfMiddleware.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Try again later.",
  },
});

// Get CSRF token
router.get("/csrf", (req, res) => {
  const existingCookie = req.cookies?.csrfToken;
  const csrfToken = createCsrfToken(res, existingCookie);

  res.status(200).json({
    csrfToken,
  });
});

// Register
router.post(
  "/register",
  authLimiter,
  verifyCsrfToken,
  register
);

// Login
router.post(
  "/login",
  authLimiter,
  verifyCsrfToken,
  login
);

// Refresh session
router.post(
  "/refresh",
  verifyCsrfToken,
  refresh
);

// Logout
router.post(
  "/logout",
  verifyCsrfToken,
  logout
);

// Current authenticated user
router.get("/me", protect, getMe);

export default router;
