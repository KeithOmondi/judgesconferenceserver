import { Request, Response } from "express";
import { Gallery } from "../models/gallery.model";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

// -------------------- Build Role Filter Helper --------------------
const getGalleryFilter = (req: Request) => {
  const role = req.user?.role || "all";
  if (role === "admin" || role === "all") return {};

  return {
    $or: [
      { targetAudience: { $in: [role, "all"] } },
      { targetAudience: { $exists: false } },
      { targetAudience: null }
    ]
  };
};

// -------------------- Upload multiple media - admin only --------------------
export const uploadMedia = async (req: Request, res: Response) => {
  try {
    const { description, targetAudience } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const uploadPromises = files.map(async (file) => {
      const result = await uploadToCloudinary(file, "gallery/uploads");

      // Generate a forced-download URL for images
      const downloadUrl =
        result.resource_type === "image"
          ? cloudinary.url(result.public_id, {
              resource_type: "image",
              flags: "attachment",
              secure: true,
            })
          : result.secure_url;

      return Gallery.create({
        description,
        url: result.secure_url,
        downloadUrl,
        publicId: result.public_id,
        resourceType: result.resource_type,
        targetAudience: targetAudience || "all", // New: Consistent role-based tagging
        uploadedBy: req.user!.id,
        downloadCount: 0,
      });
    });

    const savedMedia = await Promise.all(uploadPromises);

    return res.status(201).json({
      message: `${savedMedia.length} items uploaded successfully`,
      data: savedMedia,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// -------------------- Gallery Download Tracker --------------------
export const trackGalleryDownload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const media = await Gallery.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { returnDocument: 'after' }
    );

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    const targetUrl = media.downloadUrl || media.url;
    return res.redirect(targetUrl);
  } catch (err: any) {
    return res.status(500).json({ message: "Tracking failed" });
  }
};

// -------------------- Fetch gallery - Role Aware --------------------
export const getGallery = async (req: Request, res: Response) => {
  try {
    const filter = getGalleryFilter(req);
    
    const media = await Gallery.find(filter)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name role");

    return res.status(200).json(media);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// -------------------- Admin fetch gallery (Full view) --------------------
export const getGalleryAdmin = async (req: Request, res: Response) => {
  try {
    const media = await Gallery.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email role");

    return res.status(200).json(media);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// -------------------- Delete media - admin only --------------------
export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const media = await Gallery.findById(id);

    if (!media) return res.status(404).json({ message: "Media not found" });

    const cloudinaryResult = await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.resourceType,
    });

    await media.deleteOne();

    return res.status(200).json({ message: "Media deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// -------------------- Bulk Update Audience - admin only --------------------
export const bulkUpdateAudience = async (req: Request, res: Response) => {
  try {
    const { ids, targetAudience } = req.body;

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Please provide an array of media IDs." });
    }

    if (!targetAudience) {
      return res.status(400).json({ message: "Target audience is required." });
    }

    // Perform bulk update
    const result = await Gallery.updateMany(
      { _id: { $in: ids } }, // Filter: match all IDs in the provided array
      { $set: { targetAudience } } // Action: set the new audience
    );

    return res.status(200).json({
      message: `Successfully updated audience for ${result.modifiedCount} items.`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};