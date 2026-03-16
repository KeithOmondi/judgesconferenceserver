import { Router } from "express";
import * as ChatCtrl from "../controllers/message.controller";
import { authorize, protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = Router();

// Disable caching for real-time messaging data
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

/* ============================================================
    GENERAL MESSAGE OPERATIONS (Judges & Admin)
============================================================ */

/**
 * Send Message: Only Admins can send. 
 * Note: authorize("admin") added to match the controller logic.
 */
router.post(
  "/messages", 
  protect, 
  authorize("admin"), 
  upload.single("image"), 
  ChatCtrl.sendMessage
);

router.get("/messages", protect, ChatCtrl.getMessages);
router.patch("/messages/:messageId", protect, ChatCtrl.editMessage);
router.delete("/messages/:messageId", protect, ChatCtrl.deleteMessage);

/**
 * Thread Management: Bulk Mark as Read
 * Replaced individual message markAsRead with the Thread logic
 */
router.patch("/read-thread", protect, ChatCtrl.markThreadAsRead);

/* ============================================================
    GROUP & CHANNEL RESOLUTION
============================================================ */

router.get("/my-groups", protect, ChatCtrl.getUserGroups);

/* ============================================================
    ADMIN MANAGEMENT (System Control)
============================================================ */

// Admin sends to multi-receivers, groups, or broadcast
router.post(
  "/admin/send",
  protect,
  authorize("admin"),
  upload.single("image"),
  ChatCtrl.adminSendMessage 
);

router.get("/groups", protect, authorize("admin"), ChatCtrl.adminGetGroups);
router.post("/groups/create", protect, authorize("admin"), ChatCtrl.adminCreateGroup);
router.patch("/groups/:groupId", protect, authorize("admin"), ChatCtrl.adminUpdateGroup);
router.post("/groups/:groupId/members", protect, authorize("admin"), ChatCtrl.adminAddMembers);
router.delete("/groups/:groupId/members/:userId", protect, authorize("admin"), ChatCtrl.adminRemoveMember);

// History & Audit Logs
router.get("/admin/messages", protect, authorize("admin"), ChatCtrl.adminGetAllMessages);
router.get("/admin/stats", protect, authorize("admin"), ChatCtrl.adminGetStats);
router.delete("/admin/purge/:messageId", protect, authorize("admin"), ChatCtrl.adminPermanentDelete);

// Thread-specific history for Admin Dashboard
router.get("/chat/messages", protect, authorize("admin"), ChatCtrl.adminGetChatMessages);

export default router;