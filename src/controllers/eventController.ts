import { Request, Response } from "express";
import Event, { EventFilter } from "../models/event.model";
import { AuthRequest } from "../middlewares/authMiddleware";

/* ===============================
    CREATE EVENT (ADMIN)
================================ */
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      location, 
      startDate,  // Updated
      endDate,    // Updated
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

    const event = await Event.create({
      title,
      description,
      location,
      startDate,
      endDate,
      isMandatory,
      status: status || "SCHEDULED",
      capacity,
      createdBy: req.user?.id,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Failed to create judicial event record" });
  }
};

/* ===============================
    GET EVENTS (FILTERED)
    ?filter=UPCOMING | PAST | RECENT | ALL
================================ */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as EventFilter) || "ALL";

    // Static method handles sorting/filtering based on startDate/endDate
    const events = await Event.getFilteredEvents(filter);

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch registry events" });
  }
};

/* ===============================
    GET SINGLE EVENT
================================ */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name role");

    if (!event) {
      return res.status(404).json({ message: "Event not found in registry" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving event details" });
  }
};

/* ===============================
    UPDATE EVENT (ADMIN)
================================ */
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    // Logic Check for dates if both are being updated
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Failed to update judicial record" });
  }
};

/* ===============================
    DELETE EVENT (ADMIN)
================================ */
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event record not found" });
    }

    res.json({ message: "Event permanently removed from registry" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete event record" });
  }
};

/* ===============================
    GUEST: GET ALL EVENTS (PUBLIC)
================================ */
export const getPublicEvents = async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as EventFilter) || "ALL";
    const events = await Event.getFilteredEvents(filter);

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public event registry" });
  }
};

/* ===============================
    GUEST: GET SINGLE EVENT (PUBLIC)
================================ */
export const getPublicEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .select("-__v")
      .populate("createdBy", "name");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving event details" });
  }
};