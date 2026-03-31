import { Request, Response } from "express";
import Event, { EventFilter } from "../models/event.model";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary";

/* ===============================
    CREATE EVENT (ADMIN)
================================ */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      location, 
      startDate, 
      endDate, 
      isMandatory, 
      status, 
      capacity,
      targetAudience 
    } = req.body;

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ 
        message: "Event end date must be strictly after the start date." 
      });
    }

    let imageData;
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
      targetAudience: targetAudience || "ALL",
      capacity,
      image: imageData,
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
export const updateEvent = async (req: Request, res: Response) => {
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

    if (req.file) {
      if (existingEvent.image?.publicId) {
        await cloudinary.uploader.destroy(existingEvent.image.publicId);
      }
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
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event record not found" });

    if (event.image?.publicId) {
      await cloudinary.uploader.destroy(event.image.publicId);
    }

    await event.deleteOne();
    res.json({ message: "Event permanently removed from registry" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete event record" });
  }
};

/* ===============================
    GET EVENTS (SCOPED BY ROLE)
================================ */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as EventFilter) || "ALL";
    // FIX: Pass the role directly; normalization happens inside the Model static method
    const userRole = req.user?.role || "ALL"; 
    
    const events = await Event.getFilteredEvents(filter, userRole);
    
    // Always return an array to keep the frontend from breaking
    res.json(events || []);
  } catch (error) {
    console.error("Get Scoped Events Error:", error);
    res.status(500).json({ message: "Failed to fetch registry events" });
  }
};

/* ===============================
    GET BY ID (WITH AUDIENCE CHECK)
================================ */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).populate("createdBy", "name role");
    if (!event) return res.status(404).json({ message: "Event not found" });

    // FIX: Normalize the local role comparison to match Schema "JUDGES"
    let userRole = req.user?.role?.toUpperCase();
    if (userRole === "JUDGE") userRole = "JUDGES";
    
    const isAdmin = req.user?.role === "admin";
    const isTargetAudience = event.targetAudience === userRole;
    const isPublic = event.targetAudience === "ALL";

    if (!isAdmin && !isTargetAudience && !isPublic) {
      return res.status(403).json({ message: "Unauthorized to view this judicial event" });
    }

    res.json(event);
  } catch (error) {
    console.error("Get Event Detail Error:", error);
    res.status(500).json({ message: "Error retrieving event details" });
  }
};

/* ===============================
    PUBLIC/GUEST ACCESS
================================ */
export const getPublicEvents = async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as EventFilter) || "ALL";
    // Public access always defaults to "ALL" audience
    const events = await Event.getFilteredEvents(filter, "ALL");
    res.json(events || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public event registry" });
  }
};

export const getPublicEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .select("-__v")
      .populate("createdBy", "name");
    
    if (!event || event.targetAudience !== "ALL") {
      return res.status(404).json({ message: "Event not found or restricted" });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving event details" });
  }
};