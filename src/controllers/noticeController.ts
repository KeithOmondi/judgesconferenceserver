import { Request, Response } from "express";
import Notice from "../models/noticeModel";
import { uploadToCloudinary } from "../config/cloudinary";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "judge" | "dr";
    pj?: string;
  };
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Internal Server Error";

/* =====================================================
    1️⃣ GET NOTICES (The Core Role-Aware Logic)
===================================================== */
export const getNotices = async (req: AuthRequest, res: Response) => {
  try {
    const { priority, search } = req.query;
    const userRole = req.user?.role;

    // Base Query: Active and non-expired
    const query: any = {
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } },
      ],
    };

    // 🛑 LOGIC: Filter by Target Audience
    if (!userRole) {
      // TRULY PUBLIC: Only show items for everyone
      query.targetAudience = "ALL";
    } else if (userRole !== "admin") {
      // AUTHENTICATED STAFF: Filter by their specific role
      const audienceTag = userRole === "judge" ? "JUDGES" : "DR";
      query.targetAudience = { $in: ["ALL", audienceTag] };
    } else {
      // ADMIN: Bypass filters to see everything
      delete query.isActive;
      delete query.$or;
    }

    if (priority && priority !== "ALL") query.priority = priority;
    if (search) query.$text = { $search: String(search) };

    const notices = await Notice.find(query)
      .sort({ priority: -1, publishDate: -1 })
      .populate("createdBy", "name")
      .lean();

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notices", error: getErrorMessage(error) });
  }
};

/* =====================================================
    2️⃣ GET SINGLE NOTICE
===================================================== */
export const getNoticeById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Track views. Track read status only if user is logged in
    const update: any = { $inc: { "stats.views": 1 } };
    if (userId) {
      update.$addToSet = { readBy: userId };
    }

    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate("createdBy", "name");

    if (!notice) return res.status(404).json({ message: "Notice not found" });

    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notice", error: getErrorMessage(error) });
  }
};

/* =====================================================
    3️⃣ CREATE NOTICE
===================================================== */
export const createNotice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, description, priority, targetAudience, eventDetails, expiryDate } = req.body;

    const attachments = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const upload = await uploadToCloudinary(file, "notices");
        attachments.push({
          fileUrl: upload.secure_url,
          fileName: upload.original_filename || file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
        });
      }
    }

    const notice = new Notice({
      title,
      description,
      priority: priority || "NORMAL",
      targetAudience: targetAudience || "ALL",
      eventDetails: eventDetails ? (typeof eventDetails === "string" ? JSON.parse(eventDetails) : eventDetails) : undefined,
      attachments,
      expiryDate,
      createdBy: userId,
    });

    await notice.save();
    res.status(201).json(await notice.populate("createdBy", "name"));
  } catch (error) {
    res.status(500).json({ message: "Failed to create notice", error: getErrorMessage(error) });
  }
};

/* =====================================================
    4️⃣ UPDATE & DELETE & DOWNLOAD
===================================================== */
export const updateNotice = async (req: AuthRequest, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (updateData.eventDetails && typeof updateData.eventDetails === "string") {
      updateData.eventDetails = JSON.parse(updateData.eventDetails);
    }
    const notice = await Notice.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate("createdBy", "name");
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: getErrorMessage(error) });
  }
};

export const deleteNotice = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: getErrorMessage(error) });
  }
};

export const downloadNotice = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, { $inc: { "stats.downloads": 1 } }, { new: true });
    if (!notice || notice.attachments.length === 0) return res.status(404).json({ message: "File not found" });
    res.json({ url: notice.attachments[0].fileUrl });
  } catch (error) {
    res.status(500).json({ message: "Download tracking failed" });
  }
};

/* =====================================================
    5️⃣ COMPATIBILITY ALIASES (Fixes your Route Errors)
===================================================== */
export const getPublicNotices = getNotices;
export const getPublicNoticeById = getNoticeById;