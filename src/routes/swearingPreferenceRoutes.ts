import { Router } from "express";
import { authorize, protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";
import * as CourtController from "../controllers/swearingPreferenceController";

const router = Router();

router.get("/", CourtController.getCourtInfo);

router.post(
  "/bios",
  protect,
  authorize("admin"),
  upload.single("image"),
  CourtController.addJudgeBio,
);

router.post(
  "/presentations",
  protect,
  authorize("admin"),
  upload.single("file"),
  CourtController.addPresentation,
);

// FIXED: Middleware added to handle multipart/form-data
router.put(
  "/program",
  protect,
  authorize("admin"),
  upload.single("file"),
  CourtController.updateProgram,
);

// Use simpler delete route; controller handles the Cloudinary lookup
router.delete(
  "/:type/:id",
  protect,
  authorize("admin"),
  CourtController.deleteItem,
);

export default router;
