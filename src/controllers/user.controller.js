import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import  jwt  from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {refreshToken, accessToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generateing Access and Refresh Tokens")
    }
}


const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend

    const {password , email, userName, fullName} = req.body
    // console.log(req.body)
    // validation - empty or not
    if(
        [fullName, email, userName, password].some((fields) => fields?.trim() === "")
    ){
        throw new ApiError(404, "Kindly enter the required fields")
    }
    // check if user already exists: username, email
   const existedUser = await User.findOne({
        $or : [{email}, {userName}] 
    })

    if(existedUser) {
        throw new ApiError(409, "User with this email already exists")
    }

    // check for images , check for avatar 
    const avatarLocalPath = req.files?.avatar[0]?.path 
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(404 , "Avatar is required")
    }
    // console.log(req.files);

    // upload them to cloudinary , avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(404 , "Avatar is required")
    }

    // create user object - create entry in db
    const user = await User.create({
        email,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        password,
        userName: userName.toLowerCase(),
        fullName
    })

    // remove password and refresh token form the fields from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    
    // check for user creation
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the User")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {
    // get req -> data from req.body
    // UserName or email
    const {userName, email, password} = req.body

    if (!(userName || email)) {
        throw new ApiError(400, "User or email is required")
    }
    // Find the user 
   const user = await User.findOne({
        $or : [{email}, {userName}]
    })

    if (!user) {
        throw new ApiError(404, "User not found with given credentials")
    }

    // Check user password 
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "User credentials are not Valid")
    }

    // Generate access and refresh tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
// console.log("Access Token : ", accessToken)
// console.log("Refresh Token : ", refreshToken)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // setting cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    }
    // send cookie
    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser,
                 accessToken, 
                 refreshToken,
            },
            "User Logged In Succcessfully"
        )
    )
    
})


const logOutUser = asyncHandler (async (req, res) => {
    // console.log(req.user._id)

    // console.log(req.cookies)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )
    
    // console.log(req.user)

    const cookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: "lax"

    }

    return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"))

})

const refreshAccessToken = asyncHandler (async (req, res) => {
        try {
   
      const incomingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken
   
      if(!incomingRefreshToken) {
       throw new ApiError(401, "Unauthorized request")
      }
   
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
     
      const user = await User.findById(decodedToken?._id)
   
      if(!user) {
       throw new ApiError(404, "User's refresh token is invalid or already in use")
      }
   
      if(incomingRefreshToken !== user.refreshToken) {
       throw new ApiError(402, "User token is incorrect")
      }
   
      const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
   
      const cookieOptions = {
       httpOnly: true,
       secure: false,
       sameSite: "lax"
      }
   
      res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(new ApiResponse(
       200,
       {
           accessToken, refreshToken : newRefreshToken
       },
       "User's RefreshToken and AccessToken refreshed Successfully"
      ))
 } catch (error) {
    throw new ApiError(404, error?.message || "Invalid user")
 }

 })

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
}