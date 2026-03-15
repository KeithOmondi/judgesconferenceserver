import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";
import * as CourtController from "../controllers/swearingPreferenceController";

const router = Router();

// Public: Get all information
router.get("/", CourtController.getCourtInfo);

// Protected: Add a Judge Bio (Expects field name 'image')
router.post(
  "/bios", 
  protect, 
  authorize("admin"),
  upload.single("image"), 
  CourtController.addJudgeBio
);

// Protected: Add Presentation (Expects field name 'file' - handles PDF/Video)
router.post(
  "/presentations", 
  protect, 
  authorize("admin"), 
  upload.single("file"), 
  CourtController.addPresentation
);

// Protected: Update Program (Just JSON data)
router.put(
  "/program", 
  protect, 
  authorize("admin"), 
  CourtController.updateProgram
);

// Protected: Delete any item (judges, presentations, program)
router.delete(
  "/:type/:id/:publicId", 
  protect, 
  authorize("admin"), 
  CourtController.deleteItem
);

export default router;