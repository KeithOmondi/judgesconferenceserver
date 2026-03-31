import { Router } from "express";
import {
  login,
  logout,
  refreshHandler,
  setupPassword,
  forgotPassword, // New controller
  resetPassword,  // New controller
} from "../controllers/auth.controller";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

/* =====================================
   1️⃣ Public Routes
   These do not require any tokens.
===================================== */

// Hybrid Login: PJ (Judge/Admin) or Email/Pass (DR)
router.post("/login", login);

// DR Password Setup: Used when login returns status 202
router.patch("/setup-password", setupPassword);

// 🛡️ Forgot Password: Initiates the reset email
router.post("/forgot-password", forgotPassword);

// 🛡️ Reset Password: Consumes the token from the URL
router.patch("/reset-password/:token", resetPassword);

// Refresh logic: Rotates tokens and checks session validity
router.post("/refresh", refreshHandler);


/* =====================================
   2️⃣ Protected Routes
   Requires a valid Access Token + Matching Session ID
===================================== */

// Logout from the current device only
router.post("/logout", protect, logout);

export default router;