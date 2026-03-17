import { Request, Response } from "express";
import CourtInformation from "../models/SwearingPreference";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

export const getCourtInfo = async (req: Request, res: Response) => {
  try {
    const info = await CourtInformation.findOne().lean();
    
    if (!info) {
      return res.status(200).json({ judges: [], presentations: [], program: { items: [], scheduledRelease: null } });
    }

    // --- TIME RESTRICTION LOGIC ---
    // If a scheduled release date exists and the current time is before that date
    if (info.program?.scheduledRelease && new Date() < new Date(info.program.scheduledRelease)) {
      return res.status(200).json({
        ...info,
        program: {
          ...info.program,
          items: [], // Hide items
          programFileUrl: null, // Hide PDF
          isLocked: true // UI helper
        }
      });
    }

    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- UPDATED PROGRAM ACTIONS ---
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { items, scheduledFor } = req.body;
    
    // Parse the items if they arrive as a JSON string from FormData
    const programItems = typeof items === 'string' ? JSON.parse(items) : items;

    let updateData: any = {
      "program.items": programItems,
      "program.scheduledRelease": scheduledFor ? new Date(scheduledFor) : null,
    };

    // Handle Program PDF Upload if present
    if (req.file) {
      // Use 'raw' or 'auto' for PDFs in Cloudinary
      const result = await uploadToCloudinary(req.file, "judiciary/programs");
      updateData["program.programFileUrl"] = result.secure_url;
      updateData["program.programFilePublicId"] = result.public_id;
    }

    const info = await CourtInformation.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true }
    );

    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- BIO ACTIONS ---
export const addJudgeBio = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Judge image is required" });

    const result = await uploadToCloudinary(req.file, "judiciary/bios");

    const judgeData = {
      name: req.body.name,
      title: req.body.title,
      description: req.body.description,
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

// --- PRESENTATION ACTIONS ---
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

export const deleteItem = async (req: Request, res: Response) => {
  const type = req.params.type as string;
  const id = req.params.id as string;
  const publicId = req.params.publicId as string | undefined;

  try {
    if (publicId && publicId !== "na") {
      const resourceType = type === "presentations" ? "video" : "image"; 
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    }

    const info = await CourtInformation.findOneAndUpdate(
      {}, 
      { $pull: { [type]: { _id: id } } as any }, 
      { new: true }
    );

    if (!info) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};