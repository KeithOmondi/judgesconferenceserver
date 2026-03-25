import { Request, Response } from "express";
import Event, { EventFilter } from "../models/event.model";
import { AuthRequest } from "../middlewares/authMiddleware";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

/* ===============================
    CREATE EVENT (ADMIN)
================================ */
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      location, 
      startDate, 
      endDate, 
      isMandatory, 
      status, 
      capacity 
    } = req.body;

    // Logic Check: End date must be after start date
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ 
        message: "Event end date must be strictly after the start date." 
      });
    }

    let imageData;
    // Optional Image Upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file, "judicial_events");
      imageData = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    const event = await Event.create({
      title,
      description,
      location,
      startDate,
      endDate,
      isMandatory,
      status: status || "SCHEDULED",
      capacity,
      image: imageData, // Optional field
      createdBy: req.user?.id,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Failed to create judicial event record" });
  }
};

/* ===============================
    UPDATE EVENT (ADMIN)
================================ */
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    let updateData = { ...req.body };

    // Handle Image Update
    if (req.file) {
      // 1. Delete old image if it exists
      if (existingEvent.image?.publicId) {
        await cloudinary.uploader.destroy(existingEvent.image.publicId);
      }
      // 2. Upload new image
      const result = await uploadToCloudinary(req.file, "judicial_events");
      updateData.image = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(event);
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ message: "Failed to update judicial record" });
  }
};

/* ===============================
    DELETE EVENT (ADMIN)
================================ */
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event record not found" });
    }

    // Cleanup: Delete image from Cloudinary if it exists
    if (event.image?.publicId) {
      await cloudinary.uploader.destroy(event.image.publicId);
    }

    await event.deleteOne();

    res.json({ message: "Event permanently removed from registry" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete event record" });
  }
};

/* --- GET methods remain largely the same --- */

export const getEvents = async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as EventFilter) || "ALL";
    const events = await Event.getFilteredEvents(filter);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch registry events" });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).populate("createdBy", "name role");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving event details" });
  }
};

export const getPublicEvents = async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as EventFilter) || "ALL";
    const events = await Event.getFilteredEvents(filter);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public event registry" });
  }
};

export const getPublicEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).select("-__v").populate("createdBy", "name");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving event details" });
  }
};