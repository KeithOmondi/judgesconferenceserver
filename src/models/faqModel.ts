// models/faqModel.ts
import mongoose, { Schema, Document } from "mongoose";

export type AudienceRole = "judge" | "dr" | "all";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  targetAudience: AudienceRole; // Added
}

const faqSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    targetAudience: { 
      type: String, 
      enum: ["judge", "dr", "all"], 
      default: "all",
      required: true 
    },
  },
  { timestamps: true }
);

faqSchema.index({ targetAudience: 1 });

export default mongoose.model<IFAQ>("FAQ", faqSchema);