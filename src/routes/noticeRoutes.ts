import express from "express";
import {
  createNotice,
  getNotices,
  getNoticeById,
  downloadNotice,
  updateNotice,
  deleteNotice,
  getPublicNotices,    // Now points to role-aware getNotices
  getPublicNoticeById  // Now points to role-aware getNoticeById
} from "../controllers/noticeController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = express.Router(); 

/* ===============================
   PUBLIC ROUTES (Truly Public)
   Note: req.user is undefined here, so controller 
   defaults to showing only "ALL" audience.
================================ */
router.get("/public", getPublicNotices);
router.get("/public/:id", getPublicNoticeById);


/* ===============================
   INTERNAL ROUTES (Judges/Staff)
================================ */
// Authenticated: Filtered by DR vs JUDGE automatically
router.get("/", protect, getNotices);
router.get("/:id", protect, getNoticeById);
router.get("/download/:id", protect, downloadNotice);


/* ===============================
   ADMIN ROUTES (Management)
================================ */
router.post(
  "/create",
  protect,
  authorize("admin"),
  upload.array("files", 5), 
  createNotice,
);

router.put(
  "/update/:id",
  protect,
  authorize("admin"),
  upload.array("files", 3),
  updateNotice,
);

router.delete(
  "/delete/:id", 
  protect, 
  authorize("admin"), 
  deleteNotice
);

export default router;