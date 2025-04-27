import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"


const registerUser = asyncHandler( async (req, res) => {

  const {username, fullName, email, password} = req.body

  if([username, fullName, email, password].some((field)=>{ 
    return field?.trim() === ""
  })){
    throw new ApiError(500, "All mandatory fields are required !");
  }

  const existedUser = await User.exists({
    $or: [{username},{email}]
  })

  if(existedUser) {
    throw new ApiError(400, "User with this username or email already exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(401, "Avatar is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(500, "Avatar file is required")
  }


  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering a user")
  }

  return res
  .status(201)
  .json(
    new ApiResponse(201, createdUser, "User Registered Successfuly")
  )
})


export {
    registerUser,
}