import { Schema, model, Document } from "mongoose";

export interface IPresentation extends Document {
  title: string;
  description?: string;
  fileUrl: string;
  downloadUrl: string;   // ← added
  publicId: string;
  fileType: "image" | "video" | "raw";
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
    downloadUrl: { type: String, required: true },  // ← added
    publicId: { type: String, required: true },
    fileType: {
      type: String,
      required: true,
      enum: ["image", "video", "raw"],
    },
    mimeType: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
  },
  { timestamps: true }
);

presentationSchema.index({ publicId: 1 });

export const Presentation = model<IPresentation>(
  "Presentation",
  presentationSchema
);