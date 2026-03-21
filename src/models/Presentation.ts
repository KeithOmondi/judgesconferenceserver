import { Schema, model, Document } from "mongoose";

export interface IPresentation extends Document {
  title: string;
  description?: string;
  fileUrl: string;
  publicId: string;
  fileType: "image" | "video" | "raw"; // Cloudinary types
  mimeType: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
}

const presentationSchema = new Schema<IPresentation>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    fileType: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileName: { type: String, required: true },
    // Changed from String to Number to match your interface
    fileSize: { type: Number, required: true }, 
  },
  { timestamps: true }
);

export const Presentation = model<IPresentation>("Presentation", presentationSchema);