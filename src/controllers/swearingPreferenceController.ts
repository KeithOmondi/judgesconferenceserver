import { Request, Response } from "express";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";
import CourtInformation from "../models/SwearingPreference"

export const getCourtInfo = async (req: Request, res: Response) => {
  try {
    const info = await CourtInformation.findOne().lean();
    if (!info) {
      return res.status(200).json({ judges: [], presentations: [], program: { items: [], scheduledRelease: null } });
    }

    // NEW: Check if the requester is an admin
    // This assumes your auth middleware attaches user info to 'req.user'
    const isAdmin = (req as any).user?.role === 'admin';

    // Time Restriction Logic: ONLY apply if NOT an admin
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

    // Admin or Public (after release time) gets the full data
    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { scheduledFor, items } = req.body;
    const updateData: any = {};

    // Handle Metadata
    if (scheduledFor) updateData["program.scheduledRelease"] = new Date(scheduledFor);
    if (items) updateData["program.items"] = JSON.parse(items);

    // Handle File Upload
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
      ...req.body,
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
  // 1. Cast 'type' to string to resolve ts(2538)
  const type = req.params.type as string; 
  const id = req.params.id as string;

  try {
    const info = await CourtInformation.findOne();
    if (!info) return res.status(404).json({ message: "Record not found" });

    // 2. Optional: Add a guard to ensure 'type' is a valid array on your model
    const allowedTypes = ["judges", "presentations"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid category type" });
    }

    // Accessing with (info as any)[type] is now safe from the index error
    const targetArray = (info as any)[type];
    
    if (!targetArray || typeof targetArray.id !== 'function') {
      return res.status(400).json({ message: "Invalid operation on this type" });
    }

    const item = targetArray.id(id);
    
    if (item) {
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
    const { name, title, bio } = req.body;
    
    // 1. Find the document and the specific judge first
    const info = await CourtInformation.findOne({ "judges._id": judgeId });
    if (!info) return res.status(404).json({ message: "Judge not found" });

    const judgeIndex = info.judges.findIndex((j: any) => j._id.toString() === judgeId);
    const existingJudge = info.judges[judgeIndex];

    const updateData: any = {};

    // 2. Handle Text Fields (Updates only if provided)
    if (name) updateData["judges.$.name"] = name;
    if (title) updateData["judges.$.title"] = title;
    if (bio) updateData["judges.$.bio"] = bio;

    // 3. Handle Image Update (If a new file is uploaded)
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (existingJudge.imagePublicId) {
        await cloudinary.uploader.destroy(existingJudge.imagePublicId);
      }

      // Upload new image
      const result = await uploadToCloudinary(req.file, "judiciary/bios");
      updateData["judges.$.imageUrl"] = result.secure_url;
      updateData["judges.$.imagePublicId"] = result.public_id;
    }

    // 4. Perform the update using the positional operator $
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