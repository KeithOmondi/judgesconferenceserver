import { Router } from "express";
import { 
  createPresentation, 
  getAllPresentations, 
  deletePresentation 
} from "../controllers/presentation.controller";
import { upload } from "../middlewares/upload";

const router = Router();

// Public: View materials
router.get("/", getAllPresentations);

// Admin: Manage materials
router.post("/upload", upload.single("file"), createPresentation);
router.delete("/:id", deletePresentation);

export default router;