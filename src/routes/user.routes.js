import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route.apply("/register").post(registerUser)

export default router;