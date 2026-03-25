import { Request, Response } from "express";
import { Presentation } from "../models/Presentation";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

export const createPresentation = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;

    if (!req.file) return res.status(400).json({ message: "No file provided" });
    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

    const result = await uploadToCloudinary(req.file, "judicial_presentations");

    const newPresentation = await Presentation.create({
      title: title.trim(),
      description: description?.trim(),
      fileUrl: result.secure_url,
      downloadUrl: result.download_url,
      publicId: result.public_id,
      fileType: result.resource_type,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      downloadCount: 0, // Initialize tracker
    });

    res.status(201).json(newPresentation);
  } catch (error: any) {
    if (error.publicId) {
      await cloudinary.uploader
        .destroy(error.publicId, { resource_type: error.resource_type })
        .catch(() => {});
    }
    res.status(500).json({ message: error.message || "Upload failed" });
  }
};

// --- NEW: Download Tracker Controller ---
export const trackDownload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Use $inc to handle atomic increments (prevents race conditions)
    const presentation = await Presentation.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!presentation) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Redirect the browser to the Cloudinary attachment URL
    res.redirect(presentation.downloadUrl);
  } catch (error) {
    res.status(500).json({ message: "Tracking failed" });
  }
};

export const getAllPresentations = async (_req: Request, res: Response) => {
  try {
    const presentations = await Presentation.find().sort({ createdAt: -1 });
    res.json(presentations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch presentations" });
  }
};

export const deletePresentation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const presentation = await Presentation.findById(id);

    if (!presentation)
      return res.status(404).json({ message: "Presentation not found" });

    const cloudinaryResult = await cloudinary.uploader.destroy(
      presentation.publicId,
      { resource_type: presentation.fileType }
    );

    if (cloudinaryResult.result !== "ok") {
      console.warn(
        `Cloudinary deletion warning for ${presentation.publicId}:`,
        cloudinaryResult.result
      );
    }

    await Presentation.findByIdAndDelete(id);
    res.json({ message: "Deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Deletion failed" });
  }
};