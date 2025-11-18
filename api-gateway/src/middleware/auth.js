import logger from "../utils/logger";
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
			return res.status(403).json({
				success: false,
				message: "invalid token",
			});
			} else {
			req.user = user;
			next();
		}
	})
};

export default validateToken;