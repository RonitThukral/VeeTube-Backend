import { Router } from "express";
import { loginUser, logOutUser, registerUser, refreshAccessToken, changeUserPassword} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// user registeration/Sign Up route
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

// user login route
router.route("/login").post(loginUser)

// secured routes
//user log out route 
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeUserPassword)


export default router;