import mongoose, { Schema, Document } from "mongoose";

export interface ICourtInformation extends Document {
  // --- BIO SECTION (Updated) ---
  judges: {
    name: string;
    title: string;
    description: string; // Combined field for bio/message
    imageUrl: string;
    imagePublicId: string;
  }[];

  // --- PRESENTATION SECTION (Stays as is) ---
  presentations: {
    title: string;
    fileUrl: string;
    fileType: string; 
    publicId: string;
    uploadedAt: Date;
  }[];

  // --- PROGRAM SECTION (Stays as is) ---
  program: {
    time: string;
    event: string;
    location: string;
    iconType?: string;
  }[];

  updatedBy: mongoose.Types.ObjectId;
}

const CourtInformationSchema: Schema = new Schema(
  {
    // Simplified Bios Grid
    judges: [
      {
        name: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true }, // Simple text blob
        imageUrl: { type: String, required: true },
        imagePublicId: { type: String },
      },
    ],

    // File Uploads (PDFs/Videos)
    presentations: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Order of Events
    program: [
      {
        time: { type: String, required: true },
        event: { type: String, required: true },
        location: { type: String },
        iconType: { type: String, default: "clock" },
      },
    ],

    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.CourtInformation || 
  mongoose.model<ICourtInformation>("CourtInformation", CourtInformationSchema);