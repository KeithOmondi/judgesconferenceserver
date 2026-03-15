import { Request, Response } from "express";
import { User } from "../models/user.model";
import { AuthRequest } from "../middlewares/authMiddleware";

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).select("-password");
  if (!user) {
    return res.status(404).json({ success: false, message: "Officer not found" });
  }
  return res.status(200).json({ success: true, user });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const updates = {
    name: req.body.name,
    pj: req.body.pj, // Swapped from email
  };

  const user = await User.findByIdAndUpdate(req.user!.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  return res.status(200).json({ success: true, user });
};

/* =====================================
    🧾 ADMIN — GET ALL USERS
===================================== */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users || [],
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Registry retrieval failed" });
  }
};

/* =====================================
    🔎 ADMIN — GET USER BY ID
===================================== */
export const getUserById = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  return res.status(200).json({ success: true, user });
};

/* =====================================
    ➕ ADMIN — CREATE NEW USER
===================================== */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, pj, role } = req.body;

    // Basic validation
    if (!name || !pj) {
      return res.status(400).json({
        success: false,
        message: "Name and PJ Number required",
      });
    }

    if (!["admin", "judge", "guest"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin, judge, or guest",
      });
    }

    // Check if PJ Number exists
    const existingUser = await User.findOne({ pj });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "PJ Number already in use" });
    }

    const newUser = await User.create({
      name,
      pj: pj.trim(),
      role,
      isActive: true,
      loginAttempts: 0,
    });

    // ✅ Safe way to remove password without using 'delete'
    // This destructures 'password' out and collects everything else into 'userObject'
    const { password, ...userObject } = newUser.toObject();

    return res.status(201).json({
      success: true,
      user: userObject,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create user",
    });
  }
};

/* =====================================
    🛠 ADMIN — UPDATE USER
===================================== */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const allowedUpdates: any = {};
    if (req.body.name) allowedUpdates.name = req.body.name;
    if (req.body.pj) allowedUpdates.pj = req.body.pj; // Swapped from email
    if (req.body.role && ["admin", "judge", "guest"].includes(req.body.role))
      allowedUpdates.role = req.body.role;
    if (req.body.isActive !== undefined)
      allowedUpdates.isActive = req.body.isActive;

    const user = await User.findByIdAndUpdate(req.params.id, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update user",
    });
  }
};

/* =====================================
    ❌ ADMIN — DELETE USER
===================================== */
export const deleteUser = async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  return res
    .status(200)
    .json({ success: true, message: "User deleted successfully" });
};

/* =====================================
    🔔 SUBSCRIBE TO WEB PUSH
===================================== */
export const subscribeToPush = async (req: AuthRequest, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = req.user!.id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Invalid subscription object" });
    }

    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { webPushSubscriptions: subscription } },
      { returnDocument: "after" },
    );

    return res.status(200).json({ message: "Secure Registry alerts enabled." });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to link browser to Registry" });
  }
};