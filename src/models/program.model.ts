import mongoose, { Schema, Document } from "mongoose";

interface IActivity {
  time: string;
  activity: string;
  facilitator?: string;
}

interface IDaySchedule {
  day: string; // e.g., "ONE", "TWO"
  date: Date;
  session_chairs?: string[];
  activities: IActivity[];
}

export interface IProgram extends Document {
  event_title: string;
  schedule: IDaySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  time: { type: String, required: true },
  activity: { type: String, required: true },
  facilitator: { type: String, default: null }
});

const DayScheduleSchema = new Schema<IDaySchedule>({
  day: { type: String, required: true },
  date: { type: Date, required: true },
  session_chairs: [{ type: String }],
  activities: [ActivitySchema]
});

const ProgramSchema = new Schema<IProgram>(
  {
    event_title: { 
      type: String, 
      required: true, 
      default: "PROGRAMME" 
    },
    schedule: [DayScheduleSchema]
  },
  { 
    timestamps: true 
  }
);

export const Program = mongoose.models.Program || mongoose.model<IProgram>("Program", ProgramSchema);