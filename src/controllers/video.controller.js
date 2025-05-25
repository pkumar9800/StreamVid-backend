import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const matchStage = {};
    if (query) {
        matchStage.title = { $regex: query, $options: "i" };
    }
    if (userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;

    const aggregate = Video.aggregate([{ $match: matchStage }, { $sort: sortStage }]);

    const options = { page, limit };
    const videos = await Video.aggregatePaginate(aggregate, options);

    res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// Publish a new video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoFilePath = req.files.videoFile[0].path;
    const thumbnailPath = req.files.thumbnail[0].path;

    const uploadedVideo = await uploadOnCloudinary(videoFilePath);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!uploadedVideo || !uploadedThumbnail) {
        throw new ApiError(500, "Failed to upload video or thumbnail");
    }

    const newVideo = await Video.create({
        videoFile: uploadedVideo.secure_url,
        thumbnail: uploadedThumbnail.secure_url,
        title,
        description,
        duration: uploadedVideo.duration,
        owner: req.user._id
    });

    res.status(201).json(new ApiResponse(201, newVideo, "Video published successfully"));
});

// Get a video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "username email");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

// Update video details
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    if (req.file) {
        const uploadedThumbnail = await uploadOnCloudinary(req.file.path);
        if (uploadedThumbnail) {
            updateData.thumbnail = uploadedThumbnail.secure_url;
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, { new: true });

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

// Delete a video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));
});

// Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json(new ApiResponse(200, video, "Video publish status updated successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
