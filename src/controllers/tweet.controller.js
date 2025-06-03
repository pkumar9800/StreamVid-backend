import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * Create a tweet
 * POST /api/tweets
 * body: { content: string }
 */

const createTweet = asyncHandler(async (req, res) => {
  const ownerId = req.user && req.user.id
  if (!ownerId || !isValidObjectId(ownerId)) {
    throw new ApiError(401, "Unauthorized")
  }

  const rawContent = typeof req.body.content === "string" ? req.body.content.trim() : ""
  if (!rawContent) {
    throw new ApiError(400, "Tweet content is required")
  }

  const MAX_TWEET_LENGTH = 280
  if (rawContent.length > MAX_TWEET_LENGTH) {
    throw new ApiError(400, `Tweet content must be at most ${MAX_TWEET_LENGTH} characters`)
  }

  const ownerExists = await User.exists({ _id: ownerId })
  if (!ownerExists) {
    throw new ApiError(404, "Owner not found")
  }

  const tweet = await Tweet.create({
    content: rawContent,
    owner: ownerId,
  })

  return res.status(201).json(
    new ApiResponse({
      status: 201,
      message: "Tweet created successfully",
      data: tweet,
    })
  )
})

/**
 * Get tweets of a specific user (paginated)
 * GET /api/tweets/user/:userId
 * query: page, limit, sort (optional)
 */

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId")
  }

  // pagination defaults
  let page = parseInt(req.query.page, 10) || 1
  let limit = parseInt(req.query.limit, 10) || 20
  page = page < 1 ? 1 : page
  limit = Math.max(1, Math.min(limit, 100))

  const sortBy = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 }

  const userExists = await User.exists({ _id: userId })
  if (!userExists) {
    throw new ApiError(404, "User not found")
  }

  const skip = (page - 1) * limit

  const [total, tweets] = await Promise.all([
    Tweet.countDocuments({ owner: userId }),
    Tweet.find({ owner: userId })
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "owner",
        select: "username name _id", // adjust fields as per your User schema
      })
      .lean(),
  ])

  const totalPages = Math.ceil(total / limit)

  return res.status(200).json(
    new ApiResponse({
      status: 200,
      message: "User tweets fetched",
      data: tweets,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  )
})

/**
 * Update a tweet (only owner)
 * PATCH /api/tweets/:tweetId
 * body: { content?: string }
 */
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  const requesterId = req.user && req.user.id

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId")
  }
  if (!requesterId || !isValidObjectId(requesterId)) {
    throw new ApiError(401, "Unauthorized")
  }

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) {
    throw new ApiError(404, "Tweet not found")
  }

  // authorization: only owner can update
  if (tweet.owner.toString() !== requesterId.toString()) {
    throw new ApiError(403, "You are not allowed to update this tweet")
  }

  // only content is updatable in this model
  if (!Object.prototype.hasOwnProperty.call(req.body, "content")) {
    throw new ApiError(400, "Nothing to update")
  }

  const newContent = typeof req.body.content === "string" ? req.body.content.trim() : ""
  if (!newContent) {
    throw new ApiError(400, "Tweet content cannot be empty")
  }

  const MAX_TWEET_LENGTH = 280
  if (newContent.length > MAX_TWEET_LENGTH) {
    throw new ApiError(400, `Tweet content must be at most ${MAX_TWEET_LENGTH} characters`)
  }

  tweet.content = newContent
  await tweet.save()

  return res.status(200).json(
    new ApiResponse({
      status: 200,
      message: "Tweet updated successfully",
      data: tweet,
    })
  )
})

/**
 * Delete a tweet (only owner)
 * DELETE /api/tweets/:tweetId
 */
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  const requesterId = req.user && req.user.id

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId")
  }
  if (!requesterId || !isValidObjectId(requesterId)) {
    throw new ApiError(401, "Unauthorized")
  }

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) {
    throw new ApiError(404, "Tweet not found")
  }

  // authorization: only owner can delete
  if (tweet.owner.toString() !== requesterId.toString()) {
    throw new ApiError(403, "You are not allowed to delete this tweet")
  }

  await tweet.deleteOne()

  return res.status(200).json(
    new ApiResponse({
      status: 200,
      message: "Tweet deleted successfully",
      data: null,
    })
  )
})

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
}
