import { Response } from "express";
import { Message } from "../models/message.model";
import { Group } from "../models/group.model";
import mongoose from "mongoose";
import { getIO } from "../socket";
import { isUserOnline } from "../socket/presence";
import { sendWebPush } from "../services/push.service";
import { User } from "../models/user.model";
import { uploadToCloudinary } from "../config/cloudinary";
import { AuthRequest } from "../middlewares/authMiddleware";

/**
 * Helper: Cloudinary Upload
 */
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
    CORE MESSAGE ACTIONS (JUDGE/GUEST READ-ONLY POLICY)
============================================================ */

/**
 * Send Message: Only Admins can call this now.
 * Judges/Guests are read-only.
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderId = req.user!.id;
    const senderRole = req.user!.role;
    let { receiver, group, text, isBroadcast } = req.body;

    // POLICY: ONLY ADMINS SEND MESSAGES
    if (senderRole !== "admin") {
      return res.status(403).json({ message: "Read-only access: You cannot send messages." });
    }

    const isTrueBroadcast = isBroadcast === "true" || isBroadcast === true;

    let imageUrl: string | undefined;
    if (req.file) imageUrl = await uploadImage(req.file as Express.Multer.File);

    const [newMessage] = await Message.create(
      [
        {
          sender: senderId,
          receiver: isTrueBroadcast ? undefined : receiver,
          group,
          text,
          imageUrl,
          isBroadcast: isTrueBroadcast,
          senderType: senderRole,
          readBy: [senderId], // Sender has obviously read it
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const message = await Message.findById(newMessage._id)
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .lean();

    const io = getIO();
    if (isTrueBroadcast) {
      io.emit("message:broadcast", message);
    } else if (group) {
      io.to(group.toString()).emit("message:new", message);
    } else if (receiver) {
      io.to(receiver.toString()).emit("message:new", message);
      io.to(senderId).emit("message:new", message);
      
      if (!isUserOnline(receiver)) {
        sendWebPush(receiver, "New Judicial Briefing", text || "New document attached");
      }
    }

    return res.status(201).json(message);
  } catch (err: any) {
    if (session.inTransaction()) await session.abortTransaction();
    return res.status(500).json({ message: err.message || "Failed to send message" });
  } finally {
    session.endSession();
  }
};

/**
 * Fetch Messages for Judges/Guests
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { receiver, isBroadcast } = req.query;

    const query: any = { isDeleted: false };

    if (isBroadcast === "true") {
      query.isBroadcast = true;
    } else {
      query.isBroadcast = { $ne: true };
      // Judges only see messages where they are the receiver (since they can't send)
      // Admins see the full thread
      if (req.user!.role === "admin") {
        query.$or = [
          { sender: userId, receiver: receiver },
          { sender: receiver, receiver: userId },
        ];
      } else {
        query.receiver = userId;
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("sender", "name role")
      .lean();

    return res.status(200).json(messages);
  } catch (err) {
    return res.status(500).json({ message: "Fetch failed" });
  }
};

/**
 * Bulk Mark Thread as Read
 * Triggered when a Judge clicks a channel in the UI
 */
export const markThreadAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { channelId, type } = req.body; // type: 'broadcast' or 'private'

    const query: any = { readBy: { $ne: userId } };
    
    if (type === "broadcast") {
      query.isBroadcast = true;
    } else {
      query.receiver = userId;
      // If we use virtual IDs like 'admin_private', we just mark all private messages for this user
    }

    await Message.updateMany(query, { $addToSet: { readBy: userId } });

    return res.status(200).json({ message: "Thread marked as read" });
  } catch {
    return res.status(500).json({ message: "Failed to mark thread as read" });
  }
};

/* ============================================================
    CHANNELS & GROUPS (FOR JUDGE DASHBOARD)
============================================================ */

export const getUserGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Calculate unread counts for Broadcasts
    const unreadBroadcasts = await Message.countDocuments({
      isBroadcast: true,
      readBy: { $ne: userId }
    });

    // Calculate unread counts for Private messages
    const unreadPrivate = await Message.countDocuments({
      receiver: userId,
      isBroadcast: { $ne: true },
      readBy: { $ne: userId }
    });

    const virtualChannels = [
      {
        _id: "global_broadcast",
        name: "Official Announcements",
        description: "Registry-wide broadcasts",
        type: "broadcast",
        isReadOnly: true,
        unreadCount: unreadBroadcasts
      },
      {
        _id: "admin_private",
        name: "Registry Admin",
        description: "Direct correspondence from Registry",
        type: "private",
        isReadOnly: true,
        unreadCount: unreadPrivate
      },
    ];

    return res.status(200).json(virtualChannels);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch channels" });
  }
};

/* ============================================================
    ADMIN SPECIFIC CONTROLLERS (FULL ACCESS)
============================================================ */

export const adminSendMessage = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const adminId = req.user!.id;
    let { receivers, receiver, group, text, isBroadcast } = req.body;
    const isTrueBroadcast = isBroadcast === true || isBroadcast === "true";

    // --- 1. NORMALIZE TARGETS ---
    let targetIds: string[] = [];
    
    if (Array.isArray(receivers)) {
      // Handles multi-select arrays
      targetIds = receivers;
    } else if (typeof receivers === "string") {
      // Handles single string sent to 'receivers' (fixes your current bug)
      targetIds = [receivers];
    } else if (receiver) {
      // Handles single string sent to 'receiver'
      targetIds = [receiver];
    }

    // Debugging the normalized result
    console.log(`🎯 Routing message to ${targetIds.length} recipient(s). Broadcast: ${isTrueBroadcast}`);

    // --- 2. EXECUTE ROUTING ---
    
    // IMAGE UPLOAD (Shared)
    let imageUrl: string | undefined;
    if (req.file) {
      const upload = await uploadToCloudinary(req.file, "messages");
      imageUrl = upload.secure_url;
    }

    const io = getIO();

    // ROUTE A: BROADCAST (Requirement 2)
    if (isTrueBroadcast) {
      const [msg] = await Message.create([{
        sender: adminId, text, imageUrl, senderType: "admin", isBroadcast: true, readBy: [adminId]
      }], { session });
      await session.commitTransaction();
      io.emit("message:broadcast", msg);
      return res.status(201).json(msg);
    }

    // ROUTE B: GROUP
    if (group) {
      const [msg] = await Message.create([{
        sender: adminId, group, text, imageUrl, senderType: "admin", readBy: [adminId]
      }], { session });
      await session.commitTransaction();
      io.to(group).emit("message:new", msg);
      return res.status(201).json(msg);
    }

    // ROUTE C: SINGLE OR MULTIPLE JUDGES (Requirements 1 & 3)
    if (targetIds.length > 0) {
      const messages = targetIds.map(id => ({
        sender: adminId, receiver: id, text, imageUrl, senderType: "admin", readBy: [adminId]
      }));
      
      const created = await Message.insertMany(messages, { session });
      await session.commitTransaction();

      created.forEach(msg => {
        const rId = msg.receiver!.toString();
        io.to(rId).emit("message:new", msg);
        if (!isUserOnline(rId)) {
          sendWebPush(rId, "New Registry Message", text || "New file received");
        }
      });

      return res.status(201).json(created);
    }

    return res.status(400).json({ message: "No recipients selected" });

  } catch (err: any) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error("Error in adminSendMessage:", err);
    return res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

export const adminGetChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, groupId, isBroadcast, page = 1, limit = 50 } = req.query;
    const query: any = { isDeleted: false };

    if (isBroadcast === "true") query.isBroadcast = true;
    else if (groupId) query.group = groupId;
    else if (receiverId) {
      query.$or = [{ sender: req.user!.id, receiver: receiverId }, { sender: receiverId, receiver: req.user!.id }];
      query.isBroadcast = { $ne: true };
    }

    const messages = await Message.find(query)
      .populate("sender receiver", "name role email")
      .sort({ createdAt: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Message.countDocuments(query);
    return res.status(200).json({ messages, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    return res.status(500).json({ message: "Admin fetch failed" });
  }
};

/* ============================================================
    LEGACY / UTILITY HELPERS (RETAINED)
============================================================ */

export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const message = await Message.findOne({ _id: messageId, sender: req.user!.id });
    if (!message) return res.status(404).json({ message: "Unauthorized" });

    message.text = text;
    message.isEdited = true;
    await message.save();

    const updated = await Message.findById(messageId).populate("sender", "name role");
    getIO().emit("message:updated", updated);
    return res.status(200).json(updated);
  } catch { return res.status(500).json({ message: "Edit failed" }); }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const msg = await Message.findOne({ _id: req.params.messageId, sender: req.user!.id });
    if (!msg) return res.status(404).json({ message: "Denied" });
    msg.isDeleted = true;
    await msg.save();
    getIO().emit("message:updated", msg);
    return res.status(200).json({ message: "Deleted" });
  } catch { return res.status(500).json({ message: "Delete failed" }); }
};

export const adminGetStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await Message.aggregate([{ $group: { _id: "$senderType", count: { $sum: 1 } } }]);
    return res.status(200).json({ total: await Message.countDocuments(), byRole: stats });
  } catch { return res.status(500).json({ message: "Stats failed" }); }
};

/* =====================================================
    GROUP MANAGEMENT (Admin Only)
===================================================== */

/**
 * Admin: Create a new group/channel
 */
export const adminCreateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const adminRole = req.user!.role;
    const { name, description, members } = req.body;

    if (adminRole !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    
    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const memberList = Array.isArray(members) ? members : [];
    if (!memberList.includes(adminId)) memberList.push(adminId);

    const newGroup = await Group.create({
      name,
      description,
      createdBy: adminId,
      members: memberList,
      isActive: true,
    });

    return res.status(201).json(newGroup);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create group" });
  }
};

/**
 * Admin: Update group details (name, description, etc.)
 */
export const adminUpdateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findByIdAndUpdate(
      groupId, 
      req.body, 
      { returnDocument: "after" }
    );

    if (!group) return res.status(404).json({ message: "Group not found" });
    
    return res.status(200).json(group);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update group" });
  }
};

/**
 * Admin: Add multiple members to a group
 */
export const adminAddMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "userIds array is required" });
    }

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: { $each: userIds } } },
      { returnDocument: "after" }
    ).populate("members", "name email role");

    if (!group) return res.status(404).json({ message: "Group not found" });

    return res.status(200).json({ message: "Members successfully added", group });
  } catch (err) {
    return res.status(500).json({ message: "Admin: Failed to add members" });
  }
};

/**
 * Admin: Remove a specific member from a group
 */
export const adminRemoveMember = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId } },
      { returnDocument: "after" }
    );

    if (!group) return res.status(404).json({ message: "Group not found" });

    return res.status(200).json({ message: "Member removed from group", group });
  } catch (err) {
    return res.status(500).json({ message: "Admin: Failed to remove member" });
  }
};

/**
 * Admin: Get all active groups with member details
 */
export const adminGetGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({ isActive: true })
      .populate("members", "name email role")
      .sort({ createdAt: -1 });
      
    return res.status(200).json(groups);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch groups" });
  }
};

export const adminGetAllMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { isBroadcast, receiverId, page = 1, limit = 100 } = req.query;
    const filter: any = { isDeleted: false };

    if (isBroadcast === "true") {
      filter.isBroadcast = true;
    } else if (receiverId) {
      filter.isBroadcast = false;
      filter.$or = [
        { sender: req.user!.id, receiver: receiverId },
        { sender: receiverId, receiver: req.user!.id },
      ];
    }

    const messages = await Message.find(filter)
      .populate("sender receiver", "name role")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Message.countDocuments(filter);
    return res.status(200).json({
      messages,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    return res.status(500).json({ message: "Admin: Failed to fetch messages" });
  }
};

export const adminPermanentDelete = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    // Hard delete from database
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    
    if (!deletedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.status(200).json({ message: "Message permanently purged from records" });
  } catch (err) {
    return res.status(500).json({ message: "Admin: Failed to purge message" });
  }
};