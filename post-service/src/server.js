import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose, { connect } from "mongoose";
import redis from "ioredis";
import cors from "cors";
import helmet from "helmet";
import postRoutes from "./routes/postRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";
import { connectToRabbitmq } from "./utils/rabbitmq.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => logger.info("Connected to MongoDB"))
	.catch((e) => logger.error("Mongo connection error", e));

const redisClient = new redis(process.env.REDIS_URI);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
	logger.info(`Received ${req.method} request to ${req.url}`);
	logger.info(`Request body: ${JSON.stringify(req.body)}`);
	next();
});

// ***homework - implement IP based rate limiting for sensitive endpoints

// routes -> pass redisClient
app.use(
	"/api/posts",
	(req, res, next) => {
		req.redisClient = redisClient;
		next();
	},
	postRoutes
);

app.use(errorHandler);

async function startServer() {
	try {
		await connectToRabbitmq();

		app.listen(PORT, () => {
			logger.info(`post-service is running on port ${PORT}`);
		});
	} catch (error) {
		logger.error("error starting server", error);
		process.exit(1);
	}
}

startServer();

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
