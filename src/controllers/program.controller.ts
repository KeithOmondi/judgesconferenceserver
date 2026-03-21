import { Request, Response } from "express";
import { Program } from "../models/program.model";

// --- PUBLIC ACCESS ---

/** @route GET /api/program */
export const getProgram = async (req: Request, res: Response) => {
  try {
    const program = await Program.findOne().lean();
    if (!program) return res.status(404).json({ message: "No program found" });
    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// --- ADMIN ACCESS ---

/** @route GET /api/admin/program */
export const getProgramForAdmin = async (req: Request, res: Response) => {
  try {
    // Fetches with extra metadata or hidden fields if necessary
    const program = await Program.findOne().sort({ updatedAt: -1 });
    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin view", error });
  }
};

/** @route POST /api/admin/program */
export const createProgram = async (req: Request, res: Response) => {
  try {
    const newProgram = await Program.create(req.body);
    res.status(201).json(newProgram);
  } catch (error) {
    res.status(400).json({ message: "Invalid data", error });
  }
};

/** @route PATCH /api/admin/program/:id */
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const updated = await Program.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Program not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Update failed", error });
  }
};

/** @route DELETE /api/admin/program/:id */
export const deleteProgram = async (req: Request, res: Response) => {
  try {
    await Program.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Program deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};