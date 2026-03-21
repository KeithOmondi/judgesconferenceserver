import { Request, Response } from "express";
import { Presentation } from "../models/Presentation";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

export const createPresentation = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    // Upload to dedicated folder
    const result = await uploadToCloudinary(req.file, "judicial_presentations");

    const newPresentation = await Presentation.create({
      title,
      description,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileType: result.resource_type,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });

    res.status(201).json(newPresentation);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Upload failed" });
  }
};

export const getAllPresentations = async (_req: Request, res: Response) => {
  try {
    const presentations = await Presentation.find().sort({ createdAt: -1 });
    res.json(presentations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch materials" });
  }
};

export const deletePresentation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const presentation = await Presentation.findById(id);
    
    if (!presentation) return res.status(404).json({ message: "Not found" });

    // Delete from Cloudinary first
    // Note: resource_type is required for videos/raw files (PDFs)
    await cloudinary.uploader.destroy(presentation.publicId, {
      resource_type: presentation.fileType 
    });

    await Presentation.findByIdAndDelete(id);
    res.json({ message: "Material deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Deletion failed" });
  }
};