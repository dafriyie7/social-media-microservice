import logger from "../utils/logger.js";

const authenticateRequest = (req, res, next) => {
	const userid = req.headers["x-user-id"];

	if (!userid) {
		logger.warn("access attempted without user ID");
		return res.status(401).json({
			success: false,
			message: "authentication requied!, please login to continue",
		});
	}

	req.user = { userid };
	next();
};

export default authenticateRequest;
