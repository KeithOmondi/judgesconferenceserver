import { Request, Response } from "express";
import CourtInformation from "../models/SwearingPreference";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

export const getCourtInfo = async (req: Request, res: Response) => {
  try {
    const info = await CourtInformation.findOne();
    res.status(200).json(info || { judges: [], presentations: [], program: [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- UPDATED BIO ACTIONS ---
export const addJudgeBio = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Judge image is required" });

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, "judiciary/bios");

    const judgeData = {
      name: req.body.name,
      title: req.body.title,
      description: req.body.description, // Simplified field
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    };

    const info = await CourtInformation.findOneAndUpdate(
      {},
      { $push: { judges: judgeData } },
      { upsert: true, new: true }
    );

    res.status(201).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- PRESENTATION ACTIONS (Stays as is) ---
export const addPresentation = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File or Video is required" });

    const result = await uploadToCloudinary(req.file, "judiciary/presentations");

    const presentationData = {
      title: req.body.title,
      fileUrl: result.secure_url,
      fileType: req.file.mimetype.split("/")[1], 
      publicId: result.public_id,
    };

    const info = await CourtInformation.findOneAndUpdate(
      {},
      { $push: { presentations: presentationData } },
      { upsert: true, new: true }
    );

    res.status(201).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- PROGRAM ACTIONS (Stays as is) ---
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { programItems } = req.body;

    const info = await CourtInformation.findOneAndUpdate(
      {},
      { $set: { program: programItems } },
      { upsert: true, new: true }
    );

    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  const type = req.params.type as string;
  const id = req.params.id as string;
  const publicId = req.params.publicId as string | undefined;

  try {
    // 1. Remove from Cloudinary
    if (publicId && publicId !== "na") {
      // Cloudinary needs 'video' for videos/PDFs often, or 'image'
      const resourceType = type === "presentations" ? "video" : "image"; 
      
      await cloudinary.uploader.destroy(publicId, { 
        resource_type: resourceType 
      });
    }

    // 2. Remove from Database
    const info = await CourtInformation.findOneAndUpdate(
      {}, 
      { $pull: { [type]: { _id: id } } as any }, 
      { new: true }
    );

    if (!info) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};