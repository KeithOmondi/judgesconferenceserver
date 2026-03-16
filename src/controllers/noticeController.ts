import { Request, Response } from "express";
import Notice from "../models/noticeModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import { uploadToCloudinary } from "../config/cloudinary";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Internal Server Error";

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .trim();

// ----------------- 1. CREATE NOTICE -----------------
export const createNotice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const {
      title,
      description,
      priority,
      targetAudience,
      eventDetails,
      expiryDate,
    } = req.body;

    const attachments = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const upload = await uploadToCloudinary(file, "notices");

        attachments.push({
          fileUrl: upload.secure_url,
          fileName: upload.original_filename || file.originalname,
          fileSize: file.size,
        });
      }
    }

    const parsedEvent =
      typeof eventDetails === "string"
        ? JSON.parse(eventDetails)
        : eventDetails;

    const notice = await Notice.create({
      title,
      description,
      slug: generateSlug(title),
      priority: priority || "NORMAL",
      targetAudience: targetAudience || "ALL",
      eventDetails: parsedEvent,
      attachments,
      expiryDate,
      createdBy: userId,
    });

    res.status(201).json(notice);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create notice", error: getErrorMessage(error) });
  }
};

// ----------------- 2. GET ALL NOTICES (ADMIN) -----------------
export const getNotices = async (req: AuthRequest, res: Response) => {
  try {
    const { priority, search } = req.query;

    const query: any = {};

    if (priority && priority !== "ALL") query.priority = priority;

    if (search) {
      query.$text = { $search: String(search) };
    }

    const notices = await Notice.find(query)
      .sort({ priority: -1, publishDate: -1 })
      .populate("createdBy", "name")
      .lean();

    res.json(notices);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch notices", error: getErrorMessage(error) });
  }
};

// ----------------- 3. GET SINGLE NOTICE -----------------
export const getNoticeById = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { "stats.views": 1 } },
      { new: true }
    ).populate("createdBy", "name");

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json(notice);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notice", error: getErrorMessage(error) });
  }
};

// ----------------- 4. UPDATE NOTICE -----------------
export const updateNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (updateData.title) {
      updateData.slug = generateSlug(updateData.title);
    }

    if (typeof updateData.eventDetails === "string") {
      updateData.eventDetails = JSON.parse(updateData.eventDetails);
    }

    const updatedNotice = await Notice.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedNotice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json(updatedNotice);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Update failed", error: getErrorMessage(error) });
  }
};

// ----------------- 5. DELETE NOTICE -----------------
export const deleteNotice = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Delete failed", error: getErrorMessage(error) });
  }
};

// ----------------- 6. DOWNLOAD TRACKING -----------------
export const downloadNotice = async (req: Request, res: Response) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { "stats.downloads": 1 } },
      { new: true }
    );

    if (!notice || notice.attachments.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json({
      url: notice.attachments[0].fileUrl,
    });
  } catch (error) {
    res.status(500).json({ message: "Download tracking failed" });
  }
};

// ----------------- 7. PUBLIC NOTICES -----------------
export const getPublicNotices = async (req: Request, res: Response) => {
  try {
    const { priority } = req.query;

    const query: any = {
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } },
      ],
    };

    if (priority && priority !== "ALL") {
      query.priority = priority;
    }

    const notices = await Notice.find(query)
      .sort({ priority: -1, publishDate: -1 })
      .select("-__v -updatedAt")
      .lean();

    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({
      message: "Public notices fetch failed",
      error: getErrorMessage(error),
    });
  }
};

// ----------------- 8. PUBLIC SINGLE NOTICE -----------------
export const getPublicNoticeById = async (req: Request, res: Response) => {
  try {
    const notice = await Notice.findOneAndUpdate(
      {
        _id: req.params.id,
        isActive: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gte: new Date() } },
        ],
      },
      { $inc: { "stats.views": 1 } },
      { new: true }
    ).select("-__v -updatedAt");

    if (!notice) {
      return res.status(404).json({
        message: "Notice not found or expired",
      });
    }

    res.status(200).json(notice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notice",
      error: getErrorMessage(error),
    });
  }
};