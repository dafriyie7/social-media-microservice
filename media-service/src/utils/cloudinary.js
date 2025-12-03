import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaTocloudinary = (file) => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				resource_type: "auto",
			},
			(error, result) => {
				if (error) {
					logger.error(
						"error while uploading media to cloudinary",
						error
					);
					reject(error);
				} else {
					resolve(result);
				}
			}
		);
		uploadStream.end(file.buffer);
	});
};

const deleteMediaFromCloudinary = async (publicId) => {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		logger.info("media deleted from cloudinary", publicId);

		return result;
	} catch (error) {
		logger.error("error while deleting media from cloudinary", error);
		throw error;
	}
};

export { uploadMediaTocloudinary, deleteMediaFromCloudinary };
