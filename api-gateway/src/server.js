import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Redis from "ioredis"
import helmet from "helmet";
import {rateLimit} from "express-rate-limit"
import {RedisStore} from "rate-limit-redis"
import logger from "./utils/logger.js";

dotenv.config();
const app = express()
const PORT = process.env.PORT

const redisClient = new Redis(process.env.REDIS_URI)

app.use(helmet())
app.use(cors())
app.use(express.json())

// rate limiting
const rateLimit = ratelimit({
	windowMs: 15 * 60 * 1000,
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

app.use(ratelimit)

app.use((req, res, next) => {
	logger.info(`Received ${req.method} request to ${req.url}`);
	logger.info(`Request body: ${JSON.stringify(req.body)}`);
	next();
});

