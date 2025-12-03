import logger from "../utils/logger.js";
import { uploadMediaTocloudinary } from "../utils/cloudinary.js";
import Media from "../models/Media.js";

const uploadMedia = async (req, res) => {
	logger.info("starting media upload");

	try {
		if (!req.file) {
			logger.error("no file uploaded");

			return res.status(400).json({
				success: false,
				message: "no file uploaded",
			});
		}

		const { originalname, mimetype, buffer } = req.file;
		const { userId } = req.user;

		logger.info(
			`file details: name=${originalname}, mimeType=${mimetype}, userId=${userId}`
		);
		logger.info("uploading media to cloudinary");

		const cloudinaryUploadResult = await uploadMediaTocloudinary(req.file);
		logger.info(
			`media uploaded successfully. result=${JSON.stringify(
				cloudinaryUploadResult
			)}`
		);

		const newMedia = new Media({
			publicId: cloudinaryUploadResult.public_id,
			originalName: originalname,
			mimeType: mimetype,
			url: cloudinaryUploadResult.secure_url,
			user: userId,
		});

		await newMedia.save();

		res.status(200).json({
			success: true,
			data: { mediaId: newMedia._id, url: newMedia.url },
		});
	} catch (error) {
		logger.error("error while uploading media", error);
		return res.status(500).json({
			success: false,
			message: error?.message || "something went wrong",
		});
	}
};

const getAllMedia = async (req, res) => {
	try {
		const result = await Media.find({});

		res.status(200).json({
			success: true,
			data: result,
		});
	} catch (error) {
		logger.error("error while getting all media", error);
		return res.status(500).json({
			success: false,
			message: error?.message || "something went wrong",
		});
	}
};

export { uploadMedia, getAllMedia };
