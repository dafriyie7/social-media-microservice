import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import helmet from "helmet";
import cors from "cors";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import routes from "./routes/identityService.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.MONGO_URI) {
	logger.error("Missing MONGO_URI in environment variables");
	process.exit(1);
}

if (!process.env.REDIS_URI) {
	logger.error("Missing REDIS_URI in environment variables");
	process.exit(1);
}

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => logger.info("Connected to MongoDB"))
	.catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URI);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
	logger.info(`Received ${req.method} request to ${req.url}`);
	logger.info(`Request body: ${JSON.stringify(req.body)}`);
	next();
});

const rateLimiter = new RateLimiterRedis({
	storeClient: redisClient,
	keyPrefix: "middleware",
	points: 10,
	duration: 1,
});

app.use((req, res, next) => {
	rateLimiter
		.consume(req.ip)
		.then(() => next())
		.catch(() => {
			logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
			res.status(429).json({ message: "Too many requests" });
		});
});

const sensitiveEndpointsLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
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

app.use("/api/auth/register", sensitiveEndpointsLimiter);
app.use("/api/auth", routes);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Identity service running on port ${PORT}`));

process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled rejection at", promise, "reason", reason);
});
