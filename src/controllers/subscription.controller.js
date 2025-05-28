import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// Toggle subscription to a channel
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Unsubscribed successfully"));
    }

    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });

    return res.status(201).json(new ApiResponse(201, subscription, "Subscribed successfully"));
});

// Get all subscribers of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username email avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});

// Get all channels a subscriber follows
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId");
    }

    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found");
    }

    const channels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username email avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
