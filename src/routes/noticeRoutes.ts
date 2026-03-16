import express from "express";
import {
  createNotice,
  getNotices,
  getNoticeById,
  downloadNotice,
  updateNotice,
  deleteNotice,
  getPublicNotices,
  getPublicNoticeById
} from "../controllers/noticeController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = express.Router(); 

/* ===============================
   PUBLIC ROUTES (Truly Public)
================================ */

// Public listings (Filtered by expiryDate and targetAudience)
router.get("/public", getPublicNotices);

// Public single view (Increments nested stats.views)
router.get("/public/:id", getPublicNoticeById);


/* ===============================
   INTERNAL ROUTES (Judges/Staff)
================================ */

// Authenticated view (includes creator metadata)
router.get("/", protect, getNotices);

// Specific detail view for logged-in users
router.get("/:id", protect, getNoticeById);

// Track downloads (Increments nested stats.downloads)
router.get("/download/:id", protect, downloadNotice);


/* ===============================
   ADMIN ROUTES (Management)
================================ */

/**
 * CREATE: Supports multiple attachments
 * Use upload.array("files", 5) if your frontend sends multiple files
 * Use upload.single("file") if you only ever send one
 */
router.post(
  "/create",
  protect,
  authorize("admin"),
  upload.array("files", 5), // Matches schema change to attachments[]
  createNotice,
);

// UPDATE: Supports metadata changes and file appending
router.put(
  "/update/:id",
  protect,
  authorize("admin"),
  upload.array("files", 3),
  updateNotice,
);

// DELETE: Full removal from DB
router.delete(
  "/delete/:id", 
  protect, 
  authorize("admin"), 
  deleteNotice
);

export default router;