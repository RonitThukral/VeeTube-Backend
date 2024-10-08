import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt  from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _ ,next) =>{
    try {
        // console.log("req.cookies : ",req.cookies)
        // console.log("Accesstoken form req.cookies.accesstoken : ",req.cookies?.accessToken)
        // console.log("RefreshToken",req.cookies.refreshToken)

        

       const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // console.log(token)

       if(!token) {
        throw new ApiError(401, "Unauthorized request to access token")
       }

       const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    //    console.log(decodedToken)

       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    //    console.log(user)

       if (!user) {
        throw new ApiError(404, "Invalid Access Token")
       }

       req.user = user
       next()

    } catch (error) {
        throw new ApiError(404, error?.message || "Something went wrong in verifying the token")
    }
})