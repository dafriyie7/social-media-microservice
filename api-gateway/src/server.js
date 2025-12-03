import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import { RedisStore } from "rate-limit-redis";
import logger from "./utils/logger.js";
import proxy from "express-http-proxy";
import errorHandler from "./middleware/errorHandler.js";
import { rateLimit } from "express-rate-limit";
import validateToken from "./middleware/auth.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URI);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const ratelimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
		res.status(429).json({ message: "Too many requests" });
	},
	store: new RedisStore({
		sendCommand: (...args) => redisClient.call(...args),
	}),
});

app.use(ratelimit);

// Request logging
app.use((req, res, next) => {
	logger.info(`Received ${req.method} request to ${req.url}`);
	if (["POST", "PUT", "PATCH"].includes(req.method)) {
		logger.info(`Request body: ${JSON.stringify(req.body)}`);
	}
	next();
});

// Proxy configuration
const proxyOptions = {
	proxyReqPathResolver: (req) => req.originalUrl.replace(/^\/v1/, "/api"),
	proxyErrorHandler: (err, res, next) => {
		logger.error(`Proxy error: ${err.message}`);
		res.status(500).json({
			message: err?.message || "Internal server error",
			error: err.message,
		});
	},
};

// Identity service proxy
app.use(
	"/v1/auth",
	proxy(process.env.IDENTITY_SERVICE_URI, {
		...proxyOptions,
		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (proxyRes, proxyResData) => {
			logger.info(
				`Response received from identity service: ${proxyRes.statusCode}`
			);
			// convert buffer to string
			return proxyResData.toString("utf8");
		},
	})
);

// post service proxy
app.use(
	"/v1/posts", validateToken, 
	proxy(process.env.POST_SERVICE_URI, {
		...proxyOptions,
		parseReqBody: true, // IMPORTANT — fixes empty body
		proxyReqBodyDecorator: (body, srcReq) => body, // forward exactly as received

		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["Content-Type"] = "application/json";
				proxyReqOpts.headers["x-user-id"] = srcReq.userId

			return proxyReqOpts;
		},

		userResDecorator: (proxyRes, proxyResData) => {
			logger.info(
				`Response received from post service: ${proxyRes.statusCode}`
			);
			return proxyResData.toString("utf8");
		},
	})
);

// media service proxy
app.use(
	"/v1/media",
	validateToken,
	proxy(process.env.MEDIA_SERVICE_URI, {
		...proxyOptions,
		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["x-user-id"] = srcReq.userId;

			if (
				!srcReq.headers["content-type"] ||
				!srcReq.headers["content-type"].startsWith(
					"multipart/form-data"
				)
			) {
				proxyReqOpts.headers["Content-Type"] = "application/json";
			}

			return proxyReqOpts; // <-- fix here
		},
		userResDecorator: (proxyRes, proxyResData) => {
			logger.info(
				`Response received from media service: ${proxyRes.statusCode}`
			);
			return proxyResData;
		},
		parseReqBody: false,
	})
);


// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
	logger.info(`API gateway running on port ${PORT}`);
	logger.info(`Identity service URL: ${process.env.IDENTITY_SERVICE_URI}`);
	logger.info(`post service URL: ${process.env.POST_SERVICE_URI}`);
	logger.info(`media service URL: ${process.env.MEDIA_SERVICE_URI}`);
	logger.info(`Redis URL: ${process.env.REDIS_URI}`);
});
