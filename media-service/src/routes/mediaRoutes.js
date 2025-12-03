import express from "express";
import multer from "multer";
import { getAllMedia, uploadMedia } from "../controllers/mediaController.js";
import logger from "../utils/logger.js";
import authenticateRequest from "../middlewares/auth.js";

const router = express.Router();

//test
router.post("/", (req, res) => {
	res.status(200).json({ success: true, message: "route works" });
});

// configure multer for file upload
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB
	},
}).single("file");

router.post(
	"/upload",
	authenticateRequest,
	(req, res, next) => {
		upload(req, res, (error) => {
			if (error instanceof multer.MulterError) {
				logger.error("multer error while uploading: ", error);
				return res.status(400).json({
					success: false,
					message: error.message,
				});
			} else if (error) {
				logger.error("error while uploading: ", error);
				return res.status(500).json({
					success: false,
					message: error.message,
				});
			}

			if (!req.file) {
				logger.error("no file uploaded");
			}

			next();
		});
	},
	uploadMedia
);

router.get("/get", authenticateRequest, getAllMedia);

export default router;
