import { Router } from "express";
import { 
  createPresentation, 
  getAllPresentations, 
  deletePresentation,
  trackDownload // ← Added
} from "../controllers/presentation.controller";
import { upload } from "../middlewares/upload";

const router = Router();

// Public: View materials
router.get("/", getAllPresentations);

// Public: Download & Track (Redirects to Cloudinary)
router.get("/download/:id", trackDownload); // ← Added tracking route

// Admin: Manage materials
router.post("/upload", upload.single("file"), createPresentation);
router.delete("/:id", deletePresentation);

export default router;