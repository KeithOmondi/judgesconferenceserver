// models/contactModel.ts
import mongoose, { Schema, Document } from "mongoose";

export type AudienceRole = "judge" | "dr" | "all";

export interface IContact extends Document {
  title: string;
  detail: string;
  sub: string;
  targetAudience: AudienceRole; // Added
}

const contactSchema = new Schema<IContact>(
  {
    title: { type: String, required: true },
    detail: { type: String, required: true },
    sub: { type: String },
    targetAudience: { 
      type: String, 
      enum: ["judge", "dr", "all"], 
      default: "all",
      required: true 
    },
  },
  { timestamps: true }
);

contactSchema.index({ targetAudience: 1 });

export default mongoose.model<IContact>("Contact", contactSchema);