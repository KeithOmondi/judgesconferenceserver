import { Request, Response,  } from "express";
import { Message, MessageAudience } from "../models/message.model";
import { User, UserRole } from "../models/user.model";
import mongoose from "mongoose";
import { getIO } from "../socket";
import { isUserOnline } from "../socket/presence";
import { sendWebPush } from "../services/push.service";
import { uploadToCloudinary } from "../config/cloudinary";
import { Group } from "../models/group.model";

/* ================================
    AuthRequest (fixed)
    — Defined here from the shape
      set by protect() in auth.middleware.ts
================================ */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    resetOnly?: boolean;
    sessionId?: string;
  };
}

/* ================================
    Helper: Resolve Broadcast Audience Filter
    Maps a token role → MessageAudience values
    the user is permitted to see.
================================ */
const resolveAudienceFilter = (role: string): MessageAudience[] => {
  const upper = role.toUpperCase();
  if (upper === "JUDGE") return ["JUDGES", "ALL"];
  if (upper === "DR") return ["DR", "ALL"];
  return ["JUDGES", "DR", "ALL"]; // admin sees everything
};

/* ================================
    Helper: Cloudinary Upload
================================ */
const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  try {
    const result = await uploadToCloudinary(file, "messages");
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload image to cloud storage");
  }
};

/* ============================================================
    CORE MESSAGE ACTIONS
============================================================ */

/**
 * sendMessage — Admin only.
 * Handles: broadcasts (with audience), group messages, direct messages.
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderId = req.user!.id;
    const senderRole = req.user!.role; // "admin" | "judge" | "dr"

    if (senderRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Read-only access: Admins only.",
      });
    }

    const { receiver, group, text, isBroadcast, audience } = req.body;
    const isTrueBroadcast = isBroadcast === "true" || isBroadcast === true;

    let imageUrl: string | undefined;
    if (req.file) imageUrl = await uploadImage(req.file);

    const [newMessage] = await Message.create(
      [
        {
          sender: senderId,
          receiver: isTrueBroadcast ? undefined : receiver,
          group: isTrueBroadcast ? undefined : group,
          text,
          imageUrl,
          isBroadcast: isTrueBroadcast,
          // Model requires audience when isBroadcast; default to "ALL"
          audience: isTrueBroadcast ? ((audience as MessageAudience) ?? "ALL") : undefined,
          senderType: senderRole, // "admin" satisfies SenderType
          readBy: [senderId],
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const message = await Message.findById(newMessage._id)
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .lean();

    const io = getIO();

    if (isTrueBroadcast) {
      // Emit to all; client-side audience filtering applies on receipt
      io.emit("message:broadcast", message);
    } else if (group) {
      io.to(group.toString()).emit("message:new", message);
    } else if (receiver) {
      io.to(receiver.toString()).emit("message:new", message);
      io.to(senderId).emit("message:new", message);

      if (!isUserOnline(receiver)) {
        sendWebPush(
          receiver,
          "New Judicial Briefing",
          text ?? "New document attached"
        );
      }
    }

    return res.status(201).json({ success: true, data: message });
  } catch (err: any) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: err.message ?? "Failed to send message",
    });
  } finally {
    session.endSession();
  }
};

/**
 * getMessages — Fetch messages for the current user.
 * Broadcasts are filtered by audience based on the caller's role.
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role; // original casing: "admin" | "judge" | "dr"
    const { receiver, isBroadcast } = req.query;

    const query: any = { isDeleted: false };

    if (isBroadcast === "true") {
      query.isBroadcast = true;

      // Admins see all broadcasts; judges and DRs are scoped to their audience
      if (userRole !== "admin") {
        query.audience = { $in: resolveAudienceFilter(userRole) };
      }
    } else {
      query.isBroadcast = { $ne: true };

      if (userRole === "admin") {
        // Admin sees the full DM thread with a given receiver
        query.$or = [
          { sender: userId, receiver: receiver },
          { sender: receiver, receiver: userId },
        ];
      } else {
        // Judges and DRs only see messages addressed to them
        query.receiver = userId;
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("sender", "name role")
      .lean();

    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Fetch failed" });
  }
};

/**
 * markThreadAsRead — Mark all messages in a thread/broadcast as read.
 */
export const markThreadAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { type } = req.body; // "broadcast" | "private"

    const query: any = { readBy: { $ne: userId } };

    if (type === "broadcast") {
      query.isBroadcast = true;

      if (userRole !== "admin") {
        query.audience = { $in: resolveAudienceFilter(userRole) };
      }
    } else {
      query.receiver = userId;
      query.isBroadcast = { $ne: true };
    }

    await Message.updateMany(query, { $addToSet: { readBy: userId } });

    return res.status(200).json({ success: true, message: "Thread marked as read" });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to mark thread as read",
    });
  }
};

/**
 * getUserGroups — Returns virtual channels with unread counts.
 * Unread broadcast counts respect audience scoping per role.
 */
export const getUserGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Broadcast unread count — scoped by role
    const broadcastQuery: any = {
      isBroadcast: true,
      readBy: { $ne: userId },
      isDeleted: false,
    };
    if (userRole !== "admin") {
      broadcastQuery.audience = { $in: resolveAudienceFilter(userRole) };
    }

    const [unreadBroadcasts, unreadPrivate] = await Promise.all([
      Message.countDocuments(broadcastQuery),
      Message.countDocuments({
        receiver: userId,
        isBroadcast: { $ne: true },
        readBy: { $ne: userId },
        isDeleted: false,
      }),
    ]);

    const virtualChannels = [
      {
        _id: "global_broadcast",
        name: "Official Announcements",
        description: "Registry-wide circulars",
        type: "broadcast",
        isReadOnly: true,
        unreadCount: unreadBroadcasts,
      },
      {
        _id: "admin_private",
        name: "Registry Admin",
        description: "Direct correspondence",
        type: "private",
        isReadOnly: true,
        unreadCount: unreadPrivate,
      },
    ];

    return res.status(200).json({ success: true, data: virtualChannels });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch channels",
    });
  }
};

/* ============================================================
    ADMIN SPECIFIC
============================================================ */

/**
 * adminSendMessage — Admin-only. Three send modes:
 *
 *  1. Broadcast  → isBroadcast: true, audience: "JUDGES" | "DR" | "ALL"
 *                  One message stored; audience field controls who sees it.
 *                  Judges cannot see DR broadcasts and vice versa.
 *
 *  2. Multi-DM   → receivers: string[], targetRole: "judge" | "dr"
 *                  Individual DM per recipient. targetRole is validated server-side —
 *                  every ID in receivers must belong to that role. This prevents
 *                  a judge's ID from ever appearing in a DR-targeted send.
 *
 *  3. Single DM  → receiver: string, targetRole: "judge" | "dr"
 *                  Same role validation, single recipient.
 *
 * Read-isolation: judges and DRs each fetch only messages where receiver === their own ID,
 * so cross-role DM leakage is impossible at the read layer too.
 */
export const adminSendMessage = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adminId = req.user!.id;
    const {
      receivers,
      receiver,
      group,
      text,
      isBroadcast,
      audience,
      targetRole, // "judge" | "dr" — required for DM sends
    } = req.body;

    const isTrueBroadcast = isBroadcast === true || isBroadcast === "true";

    // Normalise receiver list for DM paths
    let targetIds: string[] = [];
    if (Array.isArray(receivers)) targetIds = receivers;
    else if (typeof receivers === "string") targetIds = [receivers];
    else if (receiver) targetIds = [receiver];

    let imageUrl: string | undefined;
    if (req.file) {
      const upload = await uploadToCloudinary(req.file, "messages");
      imageUrl = upload.secure_url;
    }

    const io = getIO();

    /* ── 1. Broadcast ─────────────────────────────────────────────────────
       audience must be "JUDGES", "DR", or "ALL".
       Stored as a single document; resolveAudienceFilter() on read enforces
       that judges never see "DR" broadcasts and DRs never see "JUDGES" ones.
    ────────────────────────────────────────────────────────────────────── */
    if (isTrueBroadcast) {
      const resolvedAudience: MessageAudience =
        (audience as MessageAudience) ?? "ALL";

      const [msg] = await Message.create(
        [
          {
            sender: adminId,
            text,
            imageUrl,
            senderType: "admin",
            isBroadcast: true,
            audience: resolvedAudience,
            readBy: [adminId],
          },
        ],
        { session }
      );
      await session.commitTransaction();

      const populated = await Message.findById(msg._id)
        .populate("sender", "name role")
        .lean();

      io.emit("message:broadcast", populated);
      return res.status(201).json({ success: true, data: populated });
    }

    /* ── 2. Group message ─────────────────────────────────────────────────
       No role scoping needed — group membership controls access.
    ────────────────────────────────────────────────────────────────────── */
    if (group) {
      const [msg] = await Message.create(
        [
          {
            sender: adminId,
            group,
            text,
            imageUrl,
            senderType: "admin",
            readBy: [adminId],
          },
        ],
        { session }
      );
      await session.commitTransaction();

      const populated = await Message.findById(msg._id)
        .populate("sender", "name role")
        .lean();

      io.to(group).emit("message:new", populated);
      return res.status(201).json({ success: true, data: populated });
    }

    /* ── 3. Direct message (single or multi-recipient) ────────────────────
       targetRole is required. Every ID in targetIds is verified against the
       User collection to confirm they all carry that role. Any mismatch
       means the request is rejected in full — no partial sends.
    ────────────────────────────────────────────────────────────────────── */
    if (targetIds.length > 0) {
      // targetRole is mandatory for DMs
      if (!targetRole || !["judge", "dr"].includes(targetRole)) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "targetRole is required for direct messages. Must be 'judge' or 'dr'.",
        });
      }

      // Verify every selected recipient actually belongs to the declared role
      const matchingUsers = await User.find({
        _id: { $in: targetIds },
        role: targetRole,
        isActive: true,
      }).select("_id").lean();

      const validIds = new Set(matchingUsers.map((u) => u._id.toString()));
      const invalidIds = targetIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `The following recipient IDs do not belong to the '${targetRole}' role or are inactive: ${invalidIds.join(", ")}`,
        });
      }

      // All recipients verified — create one DM document per recipient
      const docs = targetIds.map((id) => ({
        sender: adminId,
        receiver: id,
        text,
        imageUrl,
        senderType: "admin" as const,
        readBy: [adminId],
      }));

      const created = await Message.insertMany(docs, { session });
      await session.commitTransaction();

      // Notify each recipient via socket / push
      created.forEach((msg) => {
        const rId = msg.receiver!.toString();
        io.to(rId).emit("message:new", msg);
        if (!isUserOnline(rId)) {
          sendWebPush(rId, "New Registry Message", text ?? "New file received");
        }
      });

      return res.status(201).json({ success: true, data: created });
    }

    return res.status(400).json({
      success: false,
      message: "No recipients selected. Provide receiver, receivers[], or set isBroadcast.",
    });
  } catch (err: any) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * editMessage — Sender can edit their own message text.
 */
export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user!.id,
      isDeleted: false,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you are not authorised to edit it",
      });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    const updated = await Message.findById(messageId)
      .populate("sender", "name role")
      .lean();

    getIO().emit("message:updated", updated);
    return res.status(200).json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: "Edit failed" });
  }
};

/**
 * deleteMessage — Soft-delete by the original sender.
 */
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const msg = await Message.findOne({
      _id: req.params.messageId,
      sender: req.user!.id,
    });

    if (!msg) {
      return res.status(404).json({
        success: false,
        message: "Message not found or access denied",
      });
    }

    msg.isDeleted = true;
    await msg.save();

    getIO().emit("message:updated", { _id: msg._id, isDeleted: true });
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch {
    return res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/**
 * adminPermanentDelete — Hard-delete by admin (audit/purge use).
 */
export const adminPermanentDelete = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const deleted = await Message.findByIdAndDelete(messageId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    getIO().emit("message:deleted", { _id: messageId });
    return res.status(200).json({
      success: true,
      message: "Message permanently purged",
    });
  } catch {
    return res.status(500).json({ success: false, message: "Purge failed" });
  }
};

/**
 * adminGetGroups — Fetch all active groups for the Registry.
 */
export const adminGetGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({ isActive: true })
      .populate("members", "name email role")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: groups });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch groups" });
  }
};

/**
 * adminCreateGroup — Create a new judicial/administrative group.
 */
export const adminCreateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, members } = req.body;

    const newGroup = await Group.create({
      name,
      description,
      members: members || [],
      createdBy: req.user!.id,
    });

    const populated = await Group.findById(newGroup._id).populate("members", "name email role");

    return res.status(201).json({ success: true, data: populated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message || "Group creation failed" });
  }
};

/**
 * adminUpdateGroup — Edit group details (e.g., name or description).
 */
export const adminUpdateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const updatedGroup = await Group.findByIdAndUpdate(groupId, req.body, { new: true });
    
    if (!updatedGroup) return res.status(404).json({ success: false, message: "Group not found" });

    return res.status(200).json({ success: true, data: updatedGroup });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

/**
 * adminAddMembers — Add specific Judges or DRs to a group.
 */
export const adminAddMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body; // Array of IDs

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: { $each: userIds } } },
      { new: true }
    ).populate("members", "name role");

    return res.status(200).json({ success: true, data: group });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to add members" });
  }
};

/**
 * adminRemoveMember — Revoke group access for a specific user.
 */
export const adminRemoveMember = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId } },
      { new: true }
    );

    return res.status(200).json({ success: true, message: "Member removed from group" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Removal failed" });
  }
};

/* ============================================================
    HISTORY & AUDIT LOGS
============================================================ */

/**
 * adminGetAllMessages — Master log for the Registry Audit.
 * Allows filtering by date, sender, or broadcast status.
 */
export const adminGetAllMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, isBroadcast } = req.query;
    const query: any = {};

    if (isBroadcast !== undefined) query.isBroadcast = isBroadcast === "true";

    const messages = await Message.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 })
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .lean();

    const total = await Message.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: messages,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Audit log retrieval failed" });
  }
};

/**
 * adminGetChatMessages — Detailed thread history for the Admin Dashboard.
 */
export const adminGetChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, groupId, isBroadcast } = req.query;
    const query: any = { isDeleted: false };

    if (isBroadcast === "true") {
      query.isBroadcast = true;
    } else if (groupId) {
      query.group = groupId;
    } else if (receiverId) {
      query.$or = [
        { sender: req.user!.id, receiver: receiverId },
        { sender: receiverId, receiver: req.user!.id }
      ];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("sender", "name role")
      .lean();

    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch thread history" });
  }
};

/**
 * adminGetStats — High-level metrics for the Principal Registry Dashboard.
 */
export const adminGetStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalMsgs, broadcastCount, activeUsers] = await Promise.all([
      Message.countDocuments(),
      Message.countDocuments({ isBroadcast: true }),
      User.countDocuments({ isActive: true })
    ]);

    // Role-based breakdown
    const roleStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalMessages: totalMsgs,
        broadcasts: broadcastCount,
        users: activeUsers,
        breakdown: roleStats
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to compile statistics" });
  }
};