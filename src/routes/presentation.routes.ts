import { Router } from "express";
import { 
  createPresentation, 
  getAllPresentations,
  getPresentationsForAdmin,  // ← renamed to match controller export
  deletePresentation,
  trackDownload,
  bulkUpdatePresentations,
} from "../controllers/presentation.controller";
import { upload } from "../middlewares/upload";
import { protect, authorize } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", protect, authorize("dr", "judge", "admin"), getAllPresentations);
router.get("/download/:id", protect, authorize("dr", "judge", "admin"), trackDownload);
router.get("/admin", protect, authorize("admin"), getPresentationsForAdmin);
router.post("/upload", protect, authorize("admin"), upload.single("file"), createPresentation);
router.delete("/:id", protect, authorize("admin"), deletePresentation);

// Admin routes section
router.patch(
  "/bulk-update", 
  protect, 
  authorize("admin"), 
  bulkUpdatePresentations
);

export default router;