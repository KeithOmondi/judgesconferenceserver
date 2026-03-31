import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";
import * as CourtController from "../controllers/swearingPreferenceController";

const router = Router();

/**
 * ==========================================
 * PUBLIC / AUTHENTICATED ROUTES
 * ==========================================
 */

// Handles role-based filtering (Judge vs DR vs All)
router.get(
  "/", 
  protect, 
  authorize("dr", "judge", "admin"), 
  CourtController.getCourtInfo
);

/**
 * ==========================================
 * ADMIN ONLY ROUTES
 * ==========================================
 */

// 1. Admin Dashboard Overview (Optimized/Lean)
router.get(
  "/admin/dashboard",
  protect,
  authorize("admin"),
  CourtController.getCourtInformation
);

// 2. Add New Entries
router.post(
  "/bios",
  protect,
  authorize("admin"),
  upload.single("image"), // Controller expects req.file
  CourtController.addJudgeBio
);

router.post(
  "/presentations",
  protect,
  authorize("admin"),
  upload.single("file"), // Controller expects req.file
  CourtController.addPresentation
);

// 3. Update Existing Entries
router.patch(
  "/judge/:judgeId", 
  protect,
  authorize("admin"), 
  upload.single("image"), // Optional image replacement
  CourtController.updateJudgeBio
);

// 4. Delete Entries
// Route: /api/court/judges/:id OR /api/court/presentations/:id
router.delete(
  "/:type/:id",
  protect,
  authorize("admin"),
  CourtController.deleteItem
);

export default router;