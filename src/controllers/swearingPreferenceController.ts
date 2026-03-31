import { Request, Response } from "express";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";
import { CourtInformation, UserRole } from "../models/SwearingPreference";

/**
 * Helper to parse targetAudience from FormData
 * Defaults to ["all"] if not provided or invalid
 */
const parseAudience = (audience: any): UserRole[] => {
  if (!audience) return ["all"];
  try {
    return typeof audience === 'string' ? JSON.parse(audience) : audience;
  } catch {
    return [audience as UserRole];
  }
};

/**
 * GET Court Information
 * Returns filtered lists based on the requester's role
 */
export const getCourtInfo = async (req: Request, res: Response) => {
  try {
    const info = await CourtInformation.findOne().lean();
    if (!info) {
      return res.status(200).json({ judges: [], presentations: [] });
    }

    const userRole = (req as any).user?.role as UserRole || "all";
    const isAdmin = userRole === "admin";

    if (!isAdmin) {
      info.judges = info.judges.filter((j: any) =>
        !j.targetAudience ||
        j.targetAudience.length === 0 ||
        j.targetAudience.includes("all") ||
        j.targetAudience.includes(userRole)
      );
      info.presentations = info.presentations.filter((p: any) =>
        !p.targetAudience ||
        p.targetAudience.length === 0 ||
        p.targetAudience.includes("all") ||
        p.targetAudience.includes(userRole)
      );
    }

    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADD Judge Bio
 */
export const addJudgeBio = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Profile image required" });
    
    const audience = parseAudience(req.body.targetAudience);
    const result = await uploadToCloudinary(req.file, "judiciary/bios");

    const judgeData = {
      name: req.body.name,
      title: req.body.title,
      description: req.body.description,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      targetAudience: audience
    };

    const info = await CourtInformation.findOneAndUpdate(
      {},
      { 
        $push: { judges: judgeData }, 
        $set: { updatedBy: (req as any).user?._id } 
      },
      { upsert: true, new: true }
    );

    res.status(201).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADD Presentation Material
 */
export const addPresentation = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Document file required" });

    const audience = parseAudience(req.body.targetAudience);
    const result = await uploadToCloudinary(req.file, "judiciary/presentations");

    const presentationData = {
      title: req.body.title,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype.split("/")[1],
      publicId: result.public_id,
      resourceType: result.resource_type || "raw",
      targetAudience: audience
    };

    const info = await CourtInformation.findOneAndUpdate(
      {},
      { 
        $push: { presentations: presentationData }, 
        $set: { updatedBy: (req as any).user?._id } 
      },
      { upsert: true, new: true }
    );

    res.status(201).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE Judge Bio
 * Handles partial updates and image replacement
 */
export const updateJudgeBio = async (req: Request, res: Response) => {
  try {
    const { judgeId } = req.params;
    const { name, title, description, targetAudience } = req.body;
    
    const info = await CourtInformation.findOne({ "judges._id": judgeId });
    if (!info) return res.status(404).json({ message: "Judge record not found" });

    const existingJudge = (info.judges as any).id(judgeId);
    const updateFields: any = { "updatedBy": (req as any).user?._id };

    if (name) updateFields["judges.$.name"] = name;
    if (title) updateFields["judges.$.title"] = title;
    if (description) updateFields["judges.$.description"] = description;
    if (targetAudience) updateFields["judges.$.targetAudience"] = parseAudience(targetAudience);

    if (req.file) {
      if (existingJudge?.imagePublicId) {
        await cloudinary.uploader.destroy(existingJudge.imagePublicId);
      }
      const result = await uploadToCloudinary(req.file, "judiciary/bios");
      updateFields["judges.$.imageUrl"] = result.secure_url;
      updateFields["judges.$.imagePublicId"] = result.public_id;
    }

    const updatedInfo = await CourtInformation.findOneAndUpdate(
      { "judges._id": judgeId },
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json(updatedInfo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE Item
 * Cleans up assets from Cloudinary before pulling from Mongo
 */
export const deleteItem = async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const validKeys = ["judges", "presentations"] as const;
  const targetKey = type as typeof validKeys[number];

  if (!validKeys.includes(targetKey)) {
    return res.status(400).json({ message: "Invalid category" });
  }

  try {
    const info = await CourtInformation.findOne();
    if (!info) return res.status(404).json({ message: "Database record not found" });

    const targetArray = info[targetKey]; 
    const item = (targetArray as any).id(id);

    if (item) {
      const publicId = item.imagePublicId || item.publicId;
      const rType = item.resourceType || "image"; 
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: rType });
      }
    }

    (targetArray as any).pull(id);
    info.updatedBy = (req as any).user?._id;
    await info.save();
    
    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Fetch all judge bios and presentations for the Admin dashboard
 * @route   GET /api/admin/court-info
 * @access  Private/Admin
 */
export const getCourtInformation = async (req: Request, res: Response) => {
  try {
    const info = await CourtInformation.findOne()
      .select("judges presentations updatedBy updatedAt")
      .populate("updatedBy", "name email")
      .lean();

    if (!info) {
      return res.status(200).json({
        success: true,
        data: { judges: [], presentations: [] },
        message: "No court information initialized yet."
      });
    }

    return res.status(200).json({
      success: true,
      count: {
        judges: info.judges.length,
        presentations: info.presentations.length
      },
      data: info
    });
    
  } catch (error) {
    console.error("Error fetching court info:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Could not retrieve court information."
    });
  }
};