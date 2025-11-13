import mongoose from "mongoose";
import argon2 from "argon2";

const userSechema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

userSechema.pre('save', async function (next) {
	if (this.isModified('password')) {
		try {
			this.password = await argon2.hash(this.password)
		} catch (error) {
			return next(error);
		}
	}
})

userSechema.methods.comparePassword = async function (candidatePassword) {
	try {
		return await argon2.verify(this.password, candidatePassword)
	} catch (error) {
		throw error;
	}
}

userSechema.index({ username: 'text' })

const User = mongoose.model('User', userSechema);

export default User;