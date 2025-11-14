import RefreshToken from "../models/RefreshToken.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import validateRegistration, { validateLogin } from "../utils/validation.js";

// user registration
export const registerUser = async (req, res) => {
	logger.info("Registration endpoint hit...");
	try {
		// validate schema
		const { error } = validateRegistration(req.body);

		if (error) {
			return res
				.status(400)
				.json({ success: false, message: error.details[0].message });
		}

		const { email, password, username } = req.body;

		let user = await User.findOne({
			$or: [{ email: email }, { username }],
		});
		if (user) {
			logger.warn("user already exists");
			return res.status(400).json({
				success: false,
				message: "user already exists",
			});
		}

		user = new User({ username, email, password });
		await user.save();
		logger.warn("user registered successfully", user._id);

		const { accessToken, refreshToken } = await generateToken(user);

		res.status(201).json({
			success: true,
			message: "user registered successfully",
			accessToken,
			refreshToken,
		});
	} catch (error) {
		logger.error("registration error occured", error);
		res.status(500).json({
			success: false,
			message: "internal server error",
		});
	}
};

// user login
export const loginUer = async (req, res) => {
	logger.info("login endpoint hit...");
	try {
		const { error } = validateLogin(req.body);

		if (error) {
			logger.warn("login validation error", error.details[0].message);
			return res.status(400).json({
				success: false,
				message: error.details[0].message,
			});
		}

		const { email, password } = req.body;

		let user = await User.findOne({ email });

		if (!user) {
			logger.warn("invalid user");
			return res.status(400).json({
				success: false,
				message: "invalid credentials",
			});
		}

		const comparepassword = await user.comparePassword(password);

		if (!comparepassword) {
			logger.warn("invalid password");
			return res.status(400).json({
				success: false,
				message: "invalid credentials",
			});
		}

		const { accessToken, refreshToken } = await generateToken(user);

		res.status(200).json({
			success: true,
			message: "user logged in successfully",
			accessToken,
			refreshToken,
			userid: user._id,
		});
	} catch (error) {
		logger.error("login error occured", error);
		res.status(500).json({
			success: false,
			message: "internal server error",
		});
	}
};

// refresh token
export const createRefreshToken = async (req, res) => {
	logger.info("refresh token endpoint hit...");
	try {
		const { gottenRefreshToken } = req.body;
		if (!refreshToken) {
			logger.warn("refresh token missing");
			return res
				.status(400)
				.json({ success: false, message: "refresh token missing" });
		}

		const storedToken = await RefreshToken.findOne({
			token: gottenRefreshToken,
		});

		if (!storedToken || storedToken.expires < Date.now()) {
			logger.warn("invalid or expired refreshtoken");
			return res.status(400).json({
				success: false,
				message: "invalid or expired refreshtoken",
			});
		}

		const user = await User.findById(storedToken.user);
		if (!user) {
			logger.warn("user not found");
			res.status(400).json({ success: false, message: "user not found" });
		}

		const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
			await generateToken(user);

		//delete the old refresh token
		await RefreshToken.deleteOne({ _id: storedToken._id });

		res.status(200).json({
			success: true,
			message: "token refreshed successfully",
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
		});
	} catch (error) {
		logger.error("refresh token error occured", error);
		res.status(500).json("internal server error");
	}
};

// logout
export const logoutUser = async (req, res) => {
	logger.info("logout endpoint hit...");
	try {
		const { refreshToken } = req.body;

		await RefreshToken.deleteOne({ token: refreshToken });

		logger.info("refresh token deleted successfully")

		res.status(200).json({
			success: true,
			message: "user logged out successfully",
		});
	} catch (error) {
		logger.info("logout error occured", error);
		res.status(500).json("internal server error");
	}
};
