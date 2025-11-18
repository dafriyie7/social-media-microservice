import logger from "../utils/logger.js";

//
const createPost = async (req, res) => {
	logger.info("Creating post endpoint hit...");
	try {
		const { content, mediaIds } = req.body;

		const newPost = new Post({
			user: req.user._id,
			content,
			mediaUrls: mediaIds || [],
		});

		await newPost.save();
		logger.info("Post created successfully");
		res.status(201).json({
			success: true,
			message: "Post created successfully",
		});
	} catch (error) {
		logger.error("error creating post", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getAllPosts = async (req, res) => {
	logger.info("Getting all posts endpoint hit...");
	try {
	} catch (error) {
		logger.error("error getting all posts", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getPost = async (req, res) => {
	logger.info("Getting post endpoint hit...");
	try {
	} catch (error) {
		logger.error("error getting post");
	}
};

const deletePost = async (req, res) => {
	logger.info("Deleting post endpoint hit...");
	try {
	} catch (error) {
		logger.error("error deleting post", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export { createPost, getAllPosts, getPost, deletePost };
