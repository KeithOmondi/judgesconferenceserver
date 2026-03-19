import { Request, Response } from "express";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";
import CourtInformation from "../models/SwearingPreference";

export const getCourtInfo = async (req: Request, res: Response) => {
  try {
    const info = await CourtInformation.findOne().lean();
    if (!info) {
      return res.status(200).json({ 
        judges: [], 
        presentations: [], 
        program: { items: [], scheduledRelease: null } 
      });
    }

    // Auth check (assuming middleware handles req.user)
    const isAdmin = (req as any).user?.role === 'admin';

    // Time Restriction Logic: Hide program details if before release time
    if (!isAdmin && info.program?.scheduledRelease && new Date() < new Date(info.program.scheduledRelease)) {
      return res.status(200).json({
        ...info,
        program: {
          ...info.program,
          items: [], 
          programFileUrl: null, 
          isLocked: true 
        }
      });
    }

    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { scheduledFor, items } = req.body;
    const updateData: any = {};

    if (scheduledFor) updateData["program.scheduledRelease"] = new Date(scheduledFor);
    if (items) updateData["program.items"] = JSON.parse(items);

    if (req.file) {
      const result = await uploadToCloudinary(req.file, "judiciary/programs");
      updateData["program.programFileUrl"] = result.secure_url;
      updateData["program.programFilePublicId"] = result.public_id;
      updateData["program.programFileResourceType"] = result.resource_type;
    }

    const info = await CourtInformation.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Program updated", program: info.program });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addJudgeBio = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image required" });
    const result = await uploadToCloudinary(req.file, "judiciary/bios");

    const judgeData = {
      name: req.body.name,
      title: req.body.title,
      description: req.body.description, // Aligned with Schema
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      resourceType: result.resource_type || "image"
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

export const addPresentation = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });
    const result = await uploadToCloudinary(req.file, "judiciary/presentations");

    const presentationData = {
      title: req.body.title,
      fileUrl: result.secure_url,
      fileType: req.file.mimetype.split("/")[1],
      publicId: result.public_id,
      resourceType: result.resource_type
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

  try {
    const info = await CourtInformation.findOne();
    if (!info) return res.status(404).json({ message: "Record not found" });

    const allowedTypes = ["judges", "presentations"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid category type" });
    }

    const targetArray = (info as any)[type];
    const item = targetArray.id(id);
    
    if (item) {
      // Handles both 'imagePublicId' for judges and 'publicId' for presentations
      const pId = item.imagePublicId || item.publicId;
      const rType = item.resourceType || "image"; 
      if (pId) {
        await cloudinary.uploader.destroy(pId, { resource_type: rType });
      }
    }

    targetArray.pull(id);
    await info.save();
    
    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJudgeBio = async (req: Request, res: Response) => {
  try {
    const { judgeId } = req.params;
    const { name, title, description } = req.body; // Aligned with Schema
    
    const info = await CourtInformation.findOne({ "judges._id": judgeId });
    if (!info) return res.status(404).json({ message: "Judge not found" });

    const existingJudge = (info.judges as any).id(judgeId);
    const updateData: any = {};

    if (name) updateData["judges.$.name"] = name;
    if (title) updateData["judges.$.title"] = title;
    if (description) updateData["judges.$.description"] = description;

    if (req.file) {
      // Cleanup old image
      if (existingJudge.imagePublicId) {
        await cloudinary.uploader.destroy(existingJudge.imagePublicId);
      }

      const result = await uploadToCloudinary(req.file, "judiciary/bios");
      updateData["judges.$.imageUrl"] = result.secure_url;
      updateData["judges.$.imagePublicId"] = result.public_id;
    }

    const updatedInfo = await CourtInformation.findOneAndUpdate(
      { "judges._id": judgeId },
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({ message: "Judge bio updated", data: updatedInfo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};