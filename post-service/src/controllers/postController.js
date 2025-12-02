import logger from "../utils/logger.js";
import Post from "../models/Post.js";
import { validateCreatePost } from "../utils/validation.js";

// invalidate posts cache data
async function invalidatePostsCache(req, input) {
	try {
		const keys = await req.redisClient.keys("posts:*");
		const cachekey = `post:${input}`

		await req.redisClient.del(cachekey);

		if (keys.length > 0) {
			await req.redisClient.del(keys);
		}
	} catch (error) {
		logger.error("error invalidating posts cache", error);
	}
}

// create post
const createPost = async (req, res) => {
	logger.info("Creating post endpoint hit...");
	try {
		const { error } = validateCreatePost(req.body);

		if (error) {
			logger.warn("login validation error", error.details[0].message);
			return res.status(400).json({
				success: false,
				message: error.details[0].message,
			});
		}

		const { content, mediaIds } = req.body;
		const { userId } = req.user;

		const newPost = new Post({
			user: userId,
			content,
			mediaUrls: mediaIds || [],
		});

		await newPost.save();

		await invalidatePostsCache(req, newPost._id.toString());

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
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const startIndex = (page - 1) * limit;

		const cacheKey = `posts:${page}:${limit}`;
		const cachedPosts = await req.redisClient.get(cacheKey);

		if (cachedPosts) {
			return res.status(200).json({
				success: true,
				data: JSON.parse(cachedPosts),
			});
		}

		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.skip(startIndex)
			.limit(limit);

		const totalPosts = await Post.countDocuments();

		const result = {
			posts,
			currentPage: page,
			totalPages: Math.ceil(totalPosts / limit),
			totalPosts,
		};

		// cache posts in redis correctly
		await req.redisClient.set(cacheKey, JSON.stringify(result), "EX", 300);

		res.status(200).json({
			success: true,
			data: result,
		});
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
		const postId = req.params.id;
		const cacheKey = `post:${postId}`;
		const cachedPost = await req.redisClient.get(cacheKey);

		if (cachedPost) {
			return res.status(200).json({
				success: true,
				data: JSON.parse(cachedPost),
			});
		}

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({
				success: false,
				message: "Post not found",
			});
		}

		await req.redisClient.set(
			cacheKey,
			JSON.stringify(post.toObject()),
			"EX",
			300
		);

		res.status(200).json({
			success: true,
			data: post,
		});
	} catch (error) {
		logger.error("error getting post", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};


const deletePost = async (req, res) => {
	logger.info("Deleting post endpoint hit...");
	try {
		const postId = req.params.id;
		const {userId} = req.user

		const post = await Post.findOneAndDelete({_id: postId, user: userId});

		if (!post) {
			return res.status(404).json({
				success: false,
				message: "Post not found",
			});
		}

		await invalidatePostsCache(req, postId)

		res.status(200).json({
			success: true,
			message: "Post deleted successfully",
		});
	} catch (error) {
		logger.error("error deleting post", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export { createPost, getAllPosts, getPost, deletePost };
