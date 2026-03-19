import { Router } from "express";
import {
  login,
  logout,
  logoutAll,
  refreshHandler,
} from "../controllers/auth.controller";

import {
  protect,
} from "../middlewares/authMiddleware";

const router = Router();

/* =====================================
   1️⃣ Public Routes
   These do not require any tokens.
===================================== */

// standard PJ-based login (Generates new Session ID)
router.post("/login", login);

// Refresh logic (Checks if Session ID is still valid in DB)
router.post("/refresh", refreshHandler);


/* =====================================
   2️⃣ Protected Routes
   Requires a valid Access Token + Matching Session ID
===================================== */

// Logout from the current device only
router.post("/logout", protect, logout);

// Logout from all devices (Clears all tokens & resets Session ID)
router.post("/logout-all", protect, logoutAll);


/* =====================================
   3️⃣ Admin & Staff Routes
   Requires specific roles + Active Session
===================================== */

/**
 * Example of how to protect a route for specific roles 
 * while maintaining the single-device restriction:
 * * router.get("/admin-stats", protect, authorize("admin"), getStats);
 */

/* =====================================
   4️⃣ Reset-Only Routes
   (Used for forced password resets/one-time links)
===================================== */

// router.post("/reset-password", protectResetOnly, resetPasswordController);


export default router;