import { Router } from "express";
import {
  getProgram,
  getProgramForAdmin,
  getAllProgramsForAdmin,
  createProgram,
  updateProgram,
  deleteProgram,
} from "../controllers/program.controller";
import { authorize, protect } from "../middlewares/authMiddleware";

const router = Router();

// ---------------------------------------------------------------------------
// PUBLIC ROUTES
// ---------------------------------------------------------------------------

/**
 * GET /api/program?role=judge|dr|all
 *
 * Role is resolved inside the controller via:
 *   1. req.query.role        ← explicit query param
 *   2. req.user.role         ← set by `protect` middleware from JWT payload
 *
 * The `protect` middleware attaches the decoded user (including their role)
 * to `req.user`, so the controller can gate content without a second DB call.
 */
router.get("/", protect, authorize("judge", "dr"), getProgram);

// ---------------------------------------------------------------------------
// ADMIN ROUTES  (protect + authorize("admin") on every route)
// ---------------------------------------------------------------------------

/**
 * GET /api/program/admin/all
 * Returns all programs grouped by targetAudience — admin overview table.
 * Must be declared BEFORE /admin/view to avoid route shadowing.
 */
router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  getAllProgramsForAdmin
);

/**
 * GET /api/program/admin/view?audience=judge|dr|all
 * Returns the most recent program. Admin can optionally filter by audience.
 */
router.get(
  "/admin/view",
  protect,
  authorize("admin"),
  getProgramForAdmin
);

/**
 * POST /api/program/admin/create
 * Body must include targetAudience: "judge" | "dr" | "all"
 */
router.post(
  "/admin/create",
  protect,
  authorize("admin"),
  createProgram
);

/**
 * PATCH /api/program/admin/update/:id
 * Partial update — only provided fields are changed (including targetAudience).
 */
router.patch(
  "/admin/update/:id",
  protect,
  authorize("admin"),
  updateProgram
);

/**
 * DELETE /api/program/admin/delete/:id
 */
router.delete(
  "/admin/delete/:id",
  protect,
  authorize("admin"),
  deleteProgram
);

export default router;