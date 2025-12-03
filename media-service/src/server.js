import express from "express";
import dotenv from "dotenv";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import helmet from "helmet";
import router from "./routes/mediaRoutes.js";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import { connectToRabbitmq, consumeEvent } from "./utils/rabbitmq.js";
import { handlePostDeleted } from "./eventHandlers/mediaEventHandlers.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => logger.info("Connected to MongoDB"))
	.catch((e) => logger.error("Mongo connection error", e));

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
	logger.info(`Received ${req.method} request to ${req.url}`);
	logger.info(`Request body: ${JSON.stringify(req.body)}`);
	next();
});

// ***homework - implement IP based rate limiting for sensitive endpoints

app.use("/api/media", router);

app.use(errorHandler);

async function startServer() {
	try {
		await connectToRabbitmq();

		await consumeEvent("post.deleted", handlePostDeleted)

		app.listen(PORT, () => {
			logger.info(`media-service is running on port ${PORT}`);
		});
	} catch (error) {
		logger.error("Error starting server", error);
		process.exit(1);
	}
}

startServer()