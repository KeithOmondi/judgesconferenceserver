import { Request, Response } from "express";
import { Program } from "../models/program.model";
import type { AudienceRole } from "../models/program.model";

// --- HELPERS ---

/**
 * Extracts and validates the caller's role from the request.
 * Expects `req.query.role` or `req.user.role` (if auth middleware attaches it).
 * Falls back to "all" if nothing is provided.
 */
const resolveRole = (req: Request): AudienceRole => {
  const raw = (req.query.role ?? (req as any).user?.role ?? "all") as string;
  const valid: AudienceRole[] = ["judge", "dr", "all"];
  return valid.includes(raw as AudienceRole) ? (raw as AudienceRole) : "all";
};

/**
 * Builds a Mongoose filter that returns programs visible to the given role.
 * "all" audience is always visible to every role.
 */
const audienceFilter = (role: AudienceRole) => ({
  targetAudience: { $in: [role, "all"] as AudienceRole[] },
});

// --- PUBLIC ACCESS ---

/**
 * @route   GET /api/program
 * @desc    Get current program gated by release date + caller role
 * @access  Public
 *
 * Query params:
 *   ?role=judge | dr | all   (or pulled from auth token via req.user.role)
 */
export const getProgram = async (req: Request, res: Response) => {
  try {
    const role = resolveRole(req);

    // Only fetch a program that this role is allowed to see
    const program = await Program.findOne(audienceFilter(role))
      .sort({ createdAt: -1 })
      .lean();

    if (!program) {
      return res.status(404).json({
        message: "No program available for your audience",
      });
    }

    const now = new Date();
    const isLocked =
      now < new Date(program.scheduledRelease) || program.isLocked === true;

    if (isLocked) {
      // Return safe metadata only — no schedule, no file URL
      return res.status(200).json({
        _id: program._id,
        event_title: program.event_title,
        theme: program.theme,
        scheduledRelease: program.scheduledRelease,
        targetAudience: program.targetAudience,
        isLocked: true,
        schedule: [],
        programFileUrl: null,
      });
    }

    return res.status(200).json({ ...program, isLocked: false });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// --- ADMIN ACCESS ---

/**
 * @route   GET /api/program/admin/view
 * @desc    Returns full program data for the admin dashboard.
 *          Optionally filter by audience via ?audience=judge|dr|all
 * @access  Admin
 */
export const getProgramForAdmin = async (req: Request, res: Response) => {
  try {
    // Admin can filter their view by a specific audience, or see everything
    const { audience } = req.query;

    const filter =
      audience && ["judge", "dr", "all"].includes(audience as string)
        ? { targetAudience: audience as AudienceRole }
        : {}; // No filter → return latest regardless of audience

    const program = await Program.findOne(filter).sort({ updatedAt: -1 });

    if (!program) {
      return res.status(404).json({ message: "No program found" });
    }

    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin view", error });
  }
};

/**
 * @route   GET /api/program/admin/all
 * @desc    Returns ALL program entries grouped by targetAudience — useful for
 *          an admin overview table showing which content targets which group.
 * @access  Admin
 */
export const getAllProgramsForAdmin = async (req: Request, res: Response) => {
  try {
    const programs = await Program.find()
      .sort({ targetAudience: 1, createdAt: -1 })
      .lean();

    // Group by audience for a structured admin response
    const grouped = programs.reduce<Record<string, typeof programs>>(
      (acc, program) => {
        const key = program.targetAudience ?? "all";
        if (!acc[key]) acc[key] = [];
        acc[key].push(program);
        return acc;
      },
      {}
    );

    res.status(200).json({ total: programs.length, grouped });
  } catch (error) {
    res.status(500).json({ message: "Error fetching all programs", error });
  }
};

/**
 * @route   POST /api/program/admin/create
 * @desc    Creates a new program entry. Admin must specify targetAudience.
 *          Defaults to "all" if omitted (see model default).
 * @access  Admin
 *
 * Body example:
 * {
 *   "event_title": "...",
 *   "theme": "...",
 *   "targetAudience": "judge",   ← required intent
 *   "schedule": [...],
 *   "scheduledRelease": "2026-05-01T08:00:00Z"
 * }
 */
export const createProgram = async (req: Request, res: Response) => {
  try {
    // Validate targetAudience explicitly before hitting the DB
    const { targetAudience } = req.body;

    if (
      targetAudience &&
      !["judge", "dr", "all"].includes(targetAudience)
    ) {
      return res.status(400).json({
        message: `Invalid targetAudience. Must be one of: "judge", "dr", "all"`,
      });
    }

    const newProgram = await Program.create(req.body);
    res.status(201).json(newProgram);
  } catch (error: any) {
    res.status(400).json({ message: "Invalid data provided", error: error.message });
  }
};

/**
 * @route   PATCH /api/program/admin/update/:id
 * @desc    Updates a program entry including its targetAudience.
 *          Handles optional file upload via Multer.
 * @access  Admin
 */
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const updateData: any = { ...req.body };

    // Validate targetAudience if it's being changed
    if (
      updateData.targetAudience &&
      !["judge", "dr", "all"].includes(updateData.targetAudience)
    ) {
      return res.status(400).json({
        message: `Invalid targetAudience. Must be one of: "judge", "dr", "all"`,
      });
    }

    if (req.file) {
      updateData.programFileUrl = req.file.path; // Adjust for cloud storage as needed
    }

    const updated = await Program.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Update failed" });
  }
};

/**
 * @route   DELETE /api/program/admin/delete/:id
 * @desc    Removes a program entry
 * @access  Admin
 */
export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const deleted = await Program.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json({ message: "Program deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};