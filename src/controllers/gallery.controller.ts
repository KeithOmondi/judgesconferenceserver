import { Response } from "express";
import { Gallery } from "../models/gallery.model";
import { AuthRequest } from "../middlewares/authMiddleware";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

// -------------------- Upload multiple media - admin only --------------------
export const uploadMedia = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Only admins can upload media" });
    }

    const { description } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const uploadPromises = files.map(async (file) => {
      const result = await uploadToCloudinary(file, "gallery/uploads");

      // Generate a forced-download URL for images
      // Videos use secure_url directly since they stream
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
        url: result.secure_url,       // ← for display/streaming
        downloadUrl,                   // ← for download button
        publicId: result.public_id,
        resourceType: result.resource_type,
        uploadedBy: req.user!.id,
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

// -------------------- Fetch gallery - all roles --------------------
export const getGallery = async (req: AuthRequest, res: Response) => {
  try {
    const media = await Gallery.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name role");

    return res.status(200).json(media);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// -------------------- Admin fetch gallery - admin only --------------------
export const getGalleryAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const media = await Gallery.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email role");

    return res.status(200).json(media);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// -------------------- Delete media - admin only --------------------
export const deleteMedia = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete media" });
    }

    const { id } = req.params;
    const media = await Gallery.findById(id);

    if (!media) return res.status(404).json({ message: "Media not found" });

    const cloudinaryResult = await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.resourceType,
    });

    if (cloudinaryResult.result !== "ok") {
      console.warn(
        `Cloudinary deletion warning for ${media.publicId}:`,
        cloudinaryResult.result
      );
    }

    await media.deleteOne();

    return res.status(200).json({ message: "Media deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};


