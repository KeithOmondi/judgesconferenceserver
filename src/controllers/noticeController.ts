import { Request, Response } from "express";
import Notice from "../models/noticeModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import { uploadToCloudinary } from "../config/cloudinary";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Internal Server Error";

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

    // Handle File Uploads (Supports PNG, JPG, WEBP, PDF)
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        // Upload to Cloudinary folder 'notices'
        const upload = await uploadToCloudinary(file, "notices");
        
        attachments.push({
          fileUrl: upload.secure_url,
          fileName: upload.original_filename || file.originalname,
          fileSize: file.size,
          fileType: file.mimetype, // Storing the MIME type (e.g., image/png)
        });
      }
    }

    // Safely parse eventDetails if sent as a string (FormData behavior)
    let parsedEvent;
    if (eventDetails) {
      parsedEvent = typeof eventDetails === "string" ? JSON.parse(eventDetails) : eventDetails;
    }

    const notice = new Notice({
      title,
      description,
      priority: priority || "NORMAL",
      targetAudience: targetAudience || "ALL",
      eventDetails: parsedEvent,
      attachments,
      expiryDate,
      createdBy: userId,
    });

    await notice.save();

    // Populate for immediate UI update
    const populatedNotice = await notice.populate("createdBy", "name");

    res.status(201).json(populatedNotice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create notice",
      error: getErrorMessage(error),
    });
  }
};

// ----------------- 2. GET ALL NOTICES (ADMIN) -----------------
export const getNotices = async (req: AuthRequest, res: Response) => {
  try {
    const { priority, search } = req.query;
    const query: any = {};

    if (priority && priority !== "ALL") query.priority = priority;
    if (search) query.$text = { $search: String(search) };

    const notices = await Notice.find(query)
      .sort({ priority: -1, publishDate: -1 })
      .populate("createdBy", "name")
      .lean();

    res.json(notices);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notices",
      error: getErrorMessage(error),
    });
  }
};

// ----------------- 3. GET SINGLE NOTICE -----------------
export const getNoticeById = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { "stats.views": 1 } },
      { new: true },
    ).populate("createdBy", "name");

    if (!notice) return res.status(404).json({ message: "Notice not found" });

    res.json(notice);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching notice",
      error: getErrorMessage(error),
    });
  }
};

// ----------------- 4. UPDATE NOTICE -----------------
export const updateNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.eventDetails && typeof updateData.eventDetails === "string") {
      updateData.eventDetails = JSON.parse(updateData.eventDetails);
    }

    const notice = await Notice.findById(id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    // Note: If updating files, you'd handle file logic here similarly to createNotice
    Object.assign(notice, updateData);
    await notice.save(); 

    const updatedNotice = await notice.populate("createdBy", "name");
    res.json(updatedNotice);
  } catch (error) {
    res.status(500).json({
      message: "Update failed",
      error: getErrorMessage(error),
    });
  }
};

// ----------------- 5. DELETE NOTICE -----------------
export const deleteNotice = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: getErrorMessage(error) });
  }
};

// ----------------- 6. DOWNLOAD TRACKING -----------------
export const downloadNotice = async (req: Request, res: Response) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { "stats.downloads": 1 } },
      { new: true },
    );

    if (!notice || notice.attachments.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json({ url: notice.attachments[0].fileUrl });
  } catch (error) {
    res.status(500).json({ message: "Download tracking failed" });
  }
};

// ----------------- 7. PUBLIC NOTICES & DETAILS -----------------
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

    if (priority && priority !== "ALL") query.priority = priority;

    const notices = await Notice.find(query)
      .sort({ priority: -1, publishDate: -1 })
      .populate("createdBy", "name")
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

export const getPublicNoticeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const notice = await Notice.findOne({ _id: id, isActive: true })
      .populate("createdBy", "name");

    if (!notice) {
      return res.status(404).json({ message: "Notice not found or archived" });
    }

    notice.stats.views += 1;
    await notice.save();

    res.status(200).json(notice);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notice details" });
  }
};