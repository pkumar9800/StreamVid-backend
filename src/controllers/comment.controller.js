import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100); // cap limit to 100
  const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  // Validate videoId
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // Build aggregate pipeline to match comments for the video and populate owner
  const aggregate = Comment.aggregate([
    { $match: { video: mongoose.Types.ObjectId(videoId) } },
    { $sort: sort },
    // lookup owner (user) basic fields - change fields as per your User model
    {
      $lookup: {
        from: "users", // collection name in MongoDB (usually the plural lowercase model name)
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    // project fields to return — avoid returning sensitive owner fields like password
    {
      $project: {
        content: 1,
        video: 1,
        createdAt: 1,
        updatedAt: 1,
        "owner._id": 1,
        "owner.name": 1,
        "owner.username": 1,
        "owner.avatar": 1
      }
    }
  ]);

  // Use mongoose-aggregate-paginate-v2 through model's aggregatePaginate helper
  const options = {
    page,
    limit,
    // custom labels (optional)
    customLabels: {
      totalDocs: "total",
      docs: "comments",
      limit: "perPage",
      page: "page",
      totalPages: "totalPages",
      nextPage: "nextPage",
      prevPage: "prevPage"
    }
  };

  const result = await Comment.aggregatePaginate(aggregate, options);

  return res.status(200).json(
    new ApiResponse(true, "Comments fetched", {
      comments: result.comments,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
        nextPage: result.nextPage,
        prevPage: result.prevPage
      }
    })
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const comment = new Comment({
    content: content.trim(),
    video: mongoose.Types.ObjectId(videoId),
    owner: mongoose.Types.ObjectId(req.user.id)
  });

  await comment.save();

  // Optionally populate owner fields before returning
  await comment.populate([
    { path: "owner", select: "_id name username avatar" }
  ]).execPopulate?.() /* backward compat */;

  return res.status(201).json(
    new ApiResponse(true, "Comment added", { comment })
  );
});


const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // permission check: owner or admin
  const isOwner = comment.owner?.toString() === req.user.id?.toString();
  const isAdmin = req.user?.role === "admin" || req.user?.isAdmin === true;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Not authorized to update this comment");
  }

  comment.content = content.trim();
  comment.updatedAt = new Date();

  await comment.save();

  // populate owner for response
  await comment.populate([{ path: "owner", select: "_id name username avatar" }]).execPopulate?.();

  return res.status(200).json(
    new ApiResponse(true, "Comment updated", { comment })
  );
});


const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const isOwner = comment.owner?.toString() === req.user.id?.toString();
  const isAdmin = req.user?.role === "admin" || req.user?.isAdmin === true;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Not authorized to delete this comment");
  }

  await Comment.deleteOne({ _id: commentId });

  return res.status(200).json(
    new ApiResponse(true, "Comment deleted")
  );
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
};
