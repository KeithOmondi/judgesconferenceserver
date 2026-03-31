import { Router } from "express";
import {
  uploadMedia,
  getGallery,
  getGalleryAdmin,
  deleteMedia,
  trackGalleryDownload,
  bulkUpdateAudience // Import the new controller
} from "../controllers/gallery.controller";
import { authorize, protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = Router();

/* =====================================================
    PUBLIC / PROTECTED FETCHING
===================================================== */

router.get("/get", protect, authorize("admin", "dr", "judge"), getGallery);

router.get("/download/:id", protect, trackGalleryDownload);

/* =====================================================
    ADMIN MANAGEMENT (Protected & Authorized)
===================================================== */

// Detailed fetch for admin dashboard
router.get("/admin", protect, authorize("admin"), getGalleryAdmin);

/**
 * Bulk Upload Media
 */
router.post(
  "/upload", 
  protect, 
  authorize("admin"), 
  upload.array("files", 40), 
  uploadMedia
);

/**
 * Bulk Update Audience (New)
 * Allows admin to select multiple items and change their visibility/role tag
 */
router.patch(
  "/bulk-audience", 
  protect, 
  authorize("admin"), 
  bulkUpdateAudience
);

// Delete asset
router.delete("/:id", protect, authorize("admin"), deleteMedia);

export default router;