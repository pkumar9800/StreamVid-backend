import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Helper: get authenticated user id from req.user
 */
function getUserIdFromReq(req) {
  if (!req.user) return null;
  return req.user.id || req.user._id || null;
}


const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = getUserIdFromReq(req);

  if (!userId) throw new ApiError(401, "Unauthorized Request");

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // Optionally ensure video exists
  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) throw new ApiError(404, "Video not found");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existing = await Like.findOne({
      video: videoId,
      likedBy: userId,
    }).session(session);

    let result;
    if (existing) {
      // unlike
      await Like.deleteOne({ _id: existing._id }).session(session);
      await session.commitTransaction();
      result = new ApiResponse(true, "Video unliked", { liked: false });
      return res.status(200).json(result);
    } else {
      // create like (ensure only video field is set)
      const like = await Like.create(
        [
          {
            video: videoId,
            likedBy: userId,
          },
        ],
        { session }
      );
      await session.commitTransaction();
      result = new ApiResponse(true, "Video liked", { liked: true, like: like[0] });
      return res.status(201).json(result);
    }
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});


const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = getUserIdFromReq(req);

  if (!userId) throw new ApiError(401, "Unauthorized");

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  // Optionally ensure comment exists
  const commentExists = await Comment.exists({ _id: commentId });
  if (!commentExists) throw new ApiError(404, "Comment not found");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existing = await Like.findOne({
      comment: commentId,
      likedBy: userId,
    }).session(session);

    if (existing) {
      await Like.deleteOne({ _id: existing._id }).session(session);
      await session.commitTransaction();
      return res.status(200).json(new ApiResponse(true, "Comment unliked", { liked: false }));
    } else {
      const like = await Like.create(
        [
          {
            comment: commentId,
            likedBy: userId,
          },
        ],
        { session }
      );
      await session.commitTransaction();
      return res.status(201).json(new ApiResponse(true, "Comment liked", { liked: true, like: like[0] }));
    }
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});


const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = getUserIdFromReq(req);

  if (!userId) throw new ApiError(401, "Unauthorized");

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweetExists = await Tweet.exists({ _id: tweetId });
  if (!tweetExists) throw new ApiError(404, "Tweet not found");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existing = await Like.findOne({
      tweet: tweetId,
      likedBy: userId,
    }).session(session);

    if (existing) {
      await Like.deleteOne({ _id: existing._id }).session(session);
      await session.commitTransaction();
      return res.status(200).json(new ApiResponse(true, "Tweet unliked", { liked: false }));
    } else {
      const like = await Like.create(
        [
          {
            tweet: tweetId,
            likedBy: userId,
          },
        ],
        { session }
      );
      await session.commitTransaction();
      return res.status(201).json(new ApiResponse(true, "Tweet liked", { liked: true, like: like[0] }));
    }
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});


const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) throw new ApiError(401, "Unauthorized");

  // Pagination & sorting
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const skip = (page - 1) * limit;
  const sort = req.query.sort || "-createdAt"; // default: newest likes first

  // Query: likes where video is set and likedBy = userId
  const match = { likedBy: userId, video: { $ne: null } };

  // total count
  const total = await Like.countDocuments(match);

  const likes = await Like.find(match)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate({
      path: "video",
      // populate only commonly needed fields to keep payload small; adjust as needed
      select: "title description duration owner thumbnail createdAt",
      populate: { path: "owner", select: "name username avatar" },
    })
    .lean();

  // Map out to return only videos (and meta)
  const videos = likes
    .map((l) => l.video)
    .filter(Boolean); // in case video was deleted but like remained

  const meta = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };

  return res.status(200).json(new ApiResponse(true, "Liked videos fetched", { videos, meta }));
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
};
