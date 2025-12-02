import express from "express";
import { createPost, deletePost, getAllPosts, getPost } from "../controllers/postController.js";
import authenticateRequest from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateRequest);
router.post("/create-post", createPost);
router.get("/all-posts", getAllPosts);
router.get("/:id", getPost)
router.post("/:id", deletePost)

export default router;
