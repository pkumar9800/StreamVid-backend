// controllers/playlist.controller.js
import asyncHandler from "express-async-handler";
import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

/**
 * Helpers
 */
const checkObjectId = (id) => isValidObjectId(id);

export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const ownerId = req.user && req.user.id;

  // Basic validation
  if (!name || !description) {
    return res.status(400).json({ message: "name and description are required" });
  }
  if (!ownerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Create
  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: ownerId,
    videos: [],
  });

  res.status(201).json({ message: "Playlist created", playlist });
});


export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!checkObjectId(playlistId)) {
    return res.status(400).json({ message: "Invalid playlistId" });
  }

  const playlist = await Playlist.findById(playlistId)
    .populate({ path: "owner", select: "_id name email" })
    .populate({ path: "videos" }); // adjust select if you want fewer fields

  if (!playlist) return res.status(404).json({ message: "Playlist not found" });

  res.json({ playlist });
});


export const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user && req.user.id;

  if (!checkObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });

  // Pagination & filters
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100); // 1..100
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
  const q = (req.query.q || "").trim();

  // Optionally allow users to view only their playlists or public logic here.
  // For now, playlists are user-owned and only visible to authenticated users.
  // If you want to restrict: compare requestingUserId with userId or check permissions.

  const filter = { owner: userId };
  if (q) filter.name = { $regex: q, $options: "i" };

  const [total, playlists] = await Promise.all([
    Playlist.countDocuments(filter),
    Playlist.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate({ path: "videos" })
      .populate({ path: "owner", select: "_id name" }),
  ]);

  res.json({
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    playlists,
  });
});


export const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const updates = {};
  const allowedFields = ["name", "description"];
  for (const k of allowedFields) {
    if (req.body[k] !== undefined) updates[k] = typeof req.body[k] === "string" ? req.body[k].trim() : req.body[k];
  }

  if (!checkObjectId(playlistId)) return res.status(400).json({ message: "Invalid playlistId" });
  if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No valid fields to update" });

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) return res.status(404).json({ message: "Playlist not found" });

  // permission: owner or admin
  const requestingUser = req.user;
  const isOwner = playlist.owner && playlist.owner.toString() === requestingUser.id;
  const isAdmin = requestingUser.role && requestingUser.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden: not owner or admin" });

  Object.assign(playlist, updates);
  await playlist.save();

  res.json({ message: "Playlist updated", playlist });
});


export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!checkObjectId(playlistId)) return res.status(400).json({ message: "Invalid playlistId" });

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) return res.status(404).json({ message: "Playlist not found" });

  const requestingUser = req.user;
  const isOwner = playlist.owner && playlist.owner.toString() === requestingUser.id;
  const isAdmin = requestingUser.role && requestingUser.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden: not owner or admin" });

  await playlist.remove();
  res.json({ message: "Playlist deleted" });
});


export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!checkObjectId(playlistId) || !checkObjectId(videoId)) {
    return res.status(400).json({ message: "Invalid playlistId or videoId" });
  }

  // Ensure playlist exists
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) return res.status(404).json({ message: "Playlist not found" });

  // Permission: only owner or admin can modify
  const requestingUser = req.user;
  const isOwner = playlist.owner && playlist.owner.toString() === requestingUser.id;
  const isAdmin = requestingUser.role && requestingUser.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden: not owner or admin" });

  // Ensure video exists (optional but recommended)
  const video = await Video.findById(videoId).select("_id");
  if (!video) return res.status(404).json({ message: "Video not found" });

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true }
  ).populate({ path: "videos" });

  res.json({ message: "Video added to playlist", playlist: updated });
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!checkObjectId(playlistId) || !checkObjectId(videoId)) {
    return res.status(400).json({ message: "Invalid playlistId or videoId" });
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) return res.status(404).json({ message: "Playlist not found" });

  const requestingUser = req.user;
  const isOwner = playlist.owner && playlist.owner.toString() === requestingUser.id;
  const isAdmin = requestingUser.role && requestingUser.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden: not owner or admin" });

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  ).populate({ path: "videos" });

  res.json({ message: "Video removed from playlist", playlist: updated });
});

export default {
  createPlaylist,
  getPlaylistById,
  getUserPlaylists,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
};
