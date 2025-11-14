import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import validateRegistration from "../utils/validation.js";

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

		res.status(201).json({success: true, message: "user registered successfully", accessToken, refreshToken})
	} catch (error) {
		logger.error("registration error occured", error);
		res.status(500).json({ success: false, message: "internal server error" })
	}
};

// user login
const loginUer = async (req, res) => {
	logger.info("login endpoint hit...");
	try {
		
	} catch (error) {
		logger.error("login error occured", error);
		res.status(500).json({
			success: false,
			message: "internal server error",
		});
	}
}

// refresh token

// logout

