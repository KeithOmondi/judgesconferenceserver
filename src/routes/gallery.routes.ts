import { Router } from "express";
import {
  uploadMedia,
  getGallery,
  getGalleryAdmin,
  deleteMedia
} from "../controllers/gallery.controller";
import { authorize, protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = Router();

// -------------------- GALLERY FETCH --------------------
// Protected access for all authorized users (Judges, Admins, etc.)
router.get("/get", protect, getGallery);

// -------------------- ADMIN MANAGEMENT --------------------

// Admin specific fetch (includes uploader email/details)
router.get("/admin", protect, authorize("admin"), getGalleryAdmin);

/**
 * Upload Multiple Media
 * Field name: "files" 
 * Limit: 40 files per request
 * Validates: Admin role via authorize("admin")
 */
router.post(
  "/upload", 
  protect, 
  authorize("admin"), 
  upload.array("files", 40), 
  uploadMedia
);

// Delete specific media asset by ID
router.delete("/:id", protect, authorize("admin"), deleteMedia);

export default router;