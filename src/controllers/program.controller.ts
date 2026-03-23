import { Request, Response } from "express";
import { Program } from "../models/program.model";

// --- PUBLIC ACCESS ---

/** * @route   GET /api/program 
 * @desc    Get current program (Gatekept by release date)
 */
export const getProgram = async (req: Request, res: Response) => {
  try {
    // Fetch the most recent program entry [cite: 20, 23, 44]
    const program = await Program.findOne().sort({ createdAt: -1 }).lean();
    
    if (!program) {
      return res.status(404).json({ message: "No program found" });
    }

    const now = new Date();
    const releaseTime = new Date(program.scheduledRelease);
    
    // SECURITY CHECK: If current time is before release or admin locked it manually
    const isLocked = now < releaseTime || program.isLocked === true;

    if (isLocked) {
      // Return metadata only to prevent frontend state injection of sensitive schedule
      return res.status(200).json({
        _id: program._id,
        event_title: program.event_title,
        theme: program.theme, // Theme is public knowledge [cite: 5, 15]
        scheduledRelease: program.scheduledRelease,
        isLocked: true,
        schedule: [], 
        programFileUrl: null
      });
    }

    // Return full program data including all activities and session chairs [cite: 20, 39, 47, 53]
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
    // Admins need the full document including timestamps and internal flags
    const program = await Program.findOne().sort({ updatedAt: -1 });
    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin view", error });
  }
};

/** * @route   POST /api/program/admin/create 
 * @desc    Creates a new program entry with full schedule details
 */
export const createProgram = async (req: Request, res: Response) => {
  try {
    // Ensure body contains required event_title, theme, and schedule [cite: 4, 5, 20]
    const newProgram = await Program.create(req.body);
    res.status(201).json(newProgram);
  } catch (error: any) {
    res.status(400).json({ message: "Invalid data provided", error: error.message });
  }
};

/** * @route   PATCH /api/program/admin/update/:id 
 * @desc    Updates text, schedule (including session chairs), and handles file uploads
 */
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const updateData: any = { ...req.body };

    // Handle File Upload logic (e.g., if using Multer)
    if (req.file) {
      // Example for cloud storage or local path
      // updateData.programFileUrl = req.file.path; 
    }

    // findByIdAndUpdate handles the $set for nested session_chairs and activities [cite: 20, 23, 44]
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

/** * @route   DELETE /api/program/admin/delete/:id 
 * @desc    Removes a program entry
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