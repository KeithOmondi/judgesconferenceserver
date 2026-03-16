import mongoose, { Schema, Document, Types, Model } from "mongoose";

/* ================= FILTER TYPE ================= */

export type EventFilter = "UPCOMING" | "PAST" | "RECENT" | "ALL";
export type EventStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

/* ================= EVENT INTERFACE ================= */

export interface IEvent extends Document {
  title: string;
  description: string;
  location: string;
  startDate: Date; // Replaces 'date' and 'time'
  endDate: Date; // Replaces 'endTime'
  status: EventStatus;
  isMandatory: boolean;
  capacity?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* ================= MODEL INTERFACE ================= */

interface IEventModel extends Model<IEvent> {
  getFilteredEvents(filter: EventFilter): Promise<IEvent[]>;
}

/* ================= SCHEMA ================= */

const EventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
    },
    isMandatory: { type: Boolean, default: false },
    capacity: { type: Number, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ================= STATIC FILTER METHOD ================= */

EventSchema.statics.getFilteredEvents = async function (filter: EventFilter) {
  const now = new Date();

  switch (filter) {
    case "UPCOMING":
      return this.find({
        startDate: { $gte: now },
        status: { $in: ["SCHEDULED", "ONGOING"] },
      }).sort({ startDate: 1 });

    case "PAST":
      return this.find({
        $or: [
          { endDate: { $lt: now } },
          { status: { $in: ["COMPLETED", "CANCELLED"] } },
        ],
      }).sort({ startDate: -1 });

    case "RECENT":
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return this.find({
        createdAt: { $gte: sevenDaysAgo },
      }).sort({ createdAt: -1 });

    case "ALL":
    default:
      return this.find().sort({ startDate: -1 });
  }
};

export default mongoose.model<IEvent, IEventModel>("Event", EventSchema);
