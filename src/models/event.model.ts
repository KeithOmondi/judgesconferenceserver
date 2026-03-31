import mongoose, { Schema, Document, Types, Model } from "mongoose";

/* ================= TYPES ================= */
export type EventFilter = "UPCOMING" | "PAST" | "RECENT" | "ALL";
export type EventStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type EventAudience = "JUDGES" | "DR" | "ALL"; 

/* ================= EVENT INTERFACE ================= */
export interface IEvent extends Document {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  targetAudience: EventAudience;
  isMandatory: boolean;
  capacity?: number;
  image?: {
    url: string;
    publicId: string;
  };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* ================= MODEL INTERFACE ================= */
interface IEventModel extends Model<IEvent> {
  getFilteredEvents(filter: EventFilter, userRole?: string): Promise<IEvent[]>;
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
    targetAudience: {
      type: String,
      enum: ["JUDGES", "DR", "ALL"],
      default: "ALL",
      index: true
    },
    isMandatory: { type: Boolean, default: false },
    capacity: { type: Number, default: null },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
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
EventSchema.statics.getFilteredEvents = async function (
  filter: EventFilter, 
  userRole: string = "ALL"
) {
  const now = new Date();
  
  // 1. NORMALIZE ROLE: Ensure "judge" becomes "JUDGES" to match the Enum
  let normalizedRole = userRole.toUpperCase();
  if (normalizedRole === "JUDGE") normalizedRole = "JUDGES";
  if (normalizedRole === "ADMIN") normalizedRole = "ALL"; // Admin logic handled below

  // 2. CONSTRUCT SCOPE: Scoping ensures privacy between Judges and DRs
  const scopeQuery = (userRole.toLowerCase() === "admin") 
    ? {} 
    : { targetAudience: { $in: ["ALL", normalizedRole] } };

  // 3. APPLY FILTERS
  let filterQuery: any = {};

  switch (filter) {
    case "UPCOMING":
      filterQuery = { 
        startDate: { $gte: now }, 
        status: { $in: ["SCHEDULED", "ONGOING"] } 
      };
      break;

    case "PAST":
      filterQuery = {
        $or: [
          { endDate: { $lt: now } },
          { status: { $in: ["COMPLETED", "CANCELLED"] } },
        ],
      };
      break;

    case "RECENT":
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filterQuery = { createdAt: { $gte: sevenDaysAgo } };
      break;

    case "ALL":
    default:
      filterQuery = {};
      break;
  }

  // 4. EXECUTE: Combine Scope and Filter
  // Using .find() with a combined object ensures the promise always resolves to an array
  return this.find({ ...scopeQuery, ...filterQuery })
    .sort(filter === "UPCOMING" ? { startDate: 1 } : { startDate: -1 })
    .populate("createdBy", "name role");
};

export default mongoose.model<IEvent, IEventModel>("Event", EventSchema);