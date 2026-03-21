import { Router } from "express";
import {
  getProgram,
  getProgramForAdmin,
  createProgram,
  updateProgram,
  deleteProgram,
} from "../controllers/program.controller";
import { authorize, protect } from "../middlewares/authMiddleware";
// import { protect, admin } from "../middleware/authMiddleware";

const router = Router();

// Public Routes
router.get("/", protect, getProgram);

// Admin CRUD Routes
// router.use(protect, admin); // Protect all routes below
router.get("/admin/view", protect, authorize("admin"), getProgramForAdmin);
router.post("/admin/create", protect, authorize("admin"), createProgram);
router.patch("/admin/update/:id", protect, authorize("admin"), updateProgram);
router.delete("/admin/delete/:id", protect, authorize("admin"), deleteProgram);

export default router;
