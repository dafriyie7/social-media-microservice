import Joi from "joi";

export const validateCreatePost = (data) => {
	const schema = Joi.object({
		content: Joi.string().min(1).max(500).required(),
		mediaIds: Joi.array().items(Joi.string()),
	});

	return schema.validate(data)
};