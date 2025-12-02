import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

const validateToken = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	logger.info("debugg")
	logger.info(req.headers)

	if (!token) {
		logger.warn("access attempted without token");
		return res.status(401).json({
			success: false,
			message: "authentication requied!, please login to continue",
		});
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => { 
		if (err) { 
			logger.warn("invalid token");
			return res.status(401).json({
				success: false,
				message: "invalid token",
			});
			} else {
			req.userId = user.userId

			next();
		}
	})
};

export default validateToken;