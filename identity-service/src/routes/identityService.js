import express from "express";
import { loginUer, registerUser, logoutUser, createRefreshToken} from "../controllers/identityController.js";

const router = express.Router();

router
	.post("/register", registerUser)
	.post("/login", loginUer)
	.post("/logout", logoutUser)
	.post("/refresh", createRefreshToken);
export default router;
