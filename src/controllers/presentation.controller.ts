import { Request, Response } from "express";
import { Presentation, type PresentationRole } from "../models/Presentation";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

export const createPresentation = async (req: Request, res: Response) => {
  try {
    const { title, description, targetAudience } = req.body;

    if (!req.file) return res.status(400).json({ message: "No file provided" });
    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

    const result = await uploadToCloudinary(req.file, "judicial_presentations");

    const parsedAudience: PresentationRole[] = targetAudience
      ? typeof targetAudience === "string"
        ? JSON.parse(targetAudience)
        : targetAudience
      : [];

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
      downloadCount: 0,
      targetAudience: parsedAudience,
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

export const trackDownload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const presentation = await Presentation.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!presentation) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.redirect(presentation.downloadUrl);
  } catch (error) {
    res.status(500).json({ message: "Tracking failed" });
  }
};

// Role-filtered fetch for authenticated users
export const getAllPresentations = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role as PresentationRole | undefined;

    const presentations = await Presentation.find().sort({ createdAt: -1 });

    const filtered = presentations.filter((p) =>
      !p.targetAudience ||
      p.targetAudience.length === 0 ||
      p.targetAudience.includes("all") ||
      (userRole && p.targetAudience.includes(userRole))
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch presentations" });
  }
};

// Unfiltered fetch for admin — returns all with full metadata
export const getPresentationsForAdmin = async (_req: Request, res: Response) => {
  try {
    const presentations = await Presentation.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: presentations.length,
      data: presentations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch presentations",
    });
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

// -------------------- Bulk Update Presentations - admin only --------------------
export const bulkUpdatePresentations = async (req: Request, res: Response) => {
  try {
    const { ids, targetAudience } = req.body;

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Please provide an array of presentation IDs." });
    }

    // Ensure targetAudience is parsed correctly if sent as a string/JSON
    const parsedAudience: PresentationRole[] = targetAudience
      ? typeof targetAudience === "string"
        ? JSON.parse(targetAudience)
        : targetAudience
      : ["all"];

    // Perform bulk update
    const result = await Presentation.updateMany(
      { _id: { $in: ids } },
      { $set: { targetAudience: parsedAudience } }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully updated audience for ${result.modifiedCount} presentations.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Bulk update failed" 
    });
  }
};