import mongoose, { Schema, Document } from "mongoose";

export interface IGallery extends Document {
  description?: string;
  url: string;
  downloadUrl: string;        // ← added
  publicId: string;
  resourceType: "image" | "video";
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const GallerySchema = new Schema<IGallery>(
  {
    description: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    downloadUrl: {
      type: String,
      required: true,         // ← added
    },
    publicId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

GallerySchema.index({ publicId: 1 });   // ← added, consistent with Presentation

export const Gallery = mongoose.model<IGallery>("Gallery", GallerySchema);