import logger from "../utils/logger.js";

const authenticateRequest = (req, res, next) => {
	const userId = req.headers["x-user-id"];

	if (!userId) {
		logger.warn("access attempted without user ID");
		return res.status(401).json({
			success: false,
			message: "authentication required!, please login to continue",
		});
	}

	req.user = { userId };
	next();
};

export default authenticateRequest;
