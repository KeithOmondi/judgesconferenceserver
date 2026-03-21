import { Request, Response } from "express";
import { Program } from "../models/program.model";

// --- PUBLIC ACCESS ---

/** * @route   GET /api/program 
 * @desc    Get current program (Gatekept by release date)
 */
export const getProgram = async (req: Request, res: Response) => {
  try {
    const program = await Program.findOne().lean();
    if (!program) return res.status(404).json({ message: "No program found" });

    const now = new Date();
    const releaseTime = new Date(program.scheduledRelease);
    
    // SECURITY CHECK: If time hasn't passed or admin locked it manually
    const isLocked = now < releaseTime || program.isLocked === true;

    if (isLocked) {
      // Strip sensitive schedule and file URL data
      return res.status(200).json({
        _id: program._id,
        event_title: program.event_title,
        scheduledRelease: program.scheduledRelease,
        isLocked: true,
        schedule: [], // Return empty to prevent frontend state injection
        programFileUrl: null
      });
    }

    // Otherwise, return full program data
    res.status(200).json({ ...program, isLocked: false });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// --- ADMIN ACCESS ---

/** * @route   GET /api/program/admin/view 
 * @desc    Always returns full data for Admin dashboard
 */
export const getProgramForAdmin = async (req: Request, res: Response) => {
  try {
    const program = await Program.findOne().sort({ updatedAt: -1 });
    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin view", error });
  }
};

/** @route POST /api/program/admin/create */
export const createProgram = async (req: Request, res: Response) => {
  try {
    const newProgram = await Program.create(req.body);
    res.status(201).json(newProgram);
  } catch (error) {
    res.status(400).json({ message: "Invalid data", error });
  }
};

/** * @route   PATCH /api/program/admin/update/:id 
 * @desc    Updates program text, schedule, and handles File Uploads
 */
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const updateData: any = { ...req.body };

    // Handle File Upload (If your route uses Multer and req.file exists)
    // Using a property check to ensure it aligns with your frontend key 'programFile'
    if (req.file) {
      // Assuming you are using Cloudinary or a similar service
      // updateData.programFileUrl = req.file.path; 
      
      // If using local storage/buffer:
      // updateData.programFileUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await Program.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Program not found" });
    
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Update failed" });
  }
};

/** @route DELETE /api/program/admin/delete/:id */
export const deleteProgram = async (req: Request, res: Response) => {
  try {
    await Program.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Program deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};