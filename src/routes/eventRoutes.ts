import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getPublicEvents,
  getPublicEventById,
} from "../controllers/eventController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = express.Router();

/* ===============================
   AUTHENTICATED USERS
================================ */

// Get all events (supports filter ?type=DEADLINE)
router.get("/get", protect, getEvents);

// Get single event
router.get("/get/:id", protect, getEventById);

/* ===============================
   ADMIN ROUTES
================================ */

/**
 * NOTE: upload.single("image") makes the image optional. 
 * If no file is attached to the "image" field in the request, 
 * req.file will simply be undefined, and the controller handles it.
 */

// Create event
router.post(
  "/create", 
  protect, 
  authorize("admin"), 
  upload.single("image"), 
  createEvent
);

// Update event
router.put(
  "/update/:id", 
  protect, 
  authorize("admin"), 
  upload.single("image"), 
  updateEvent
);

// Delete event
router.delete("/delete/:id", protect, authorize("admin"), deleteEvent);

/* ===============================
   GUEST / PUBLIC ROUTES
================================ */
router.get("/public", protect, authorize("guest"), getPublicEvents);
router.get("/public/:id", protect, authorize("guest"), getPublicEventById);

export default router;