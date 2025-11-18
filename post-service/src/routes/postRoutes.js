import express from "express"
import { createPost } from "../controllers/postController.js"
import authenticateRequest from "../middlewares/auth.js"

const router = express.Router()

router.use(authenticateRequest)
router.post("/create-post", createPost)

export default router