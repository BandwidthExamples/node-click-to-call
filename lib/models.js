const mongoose = require('mongoose');
const {hash, compare} = require('bcryptjs');
const sendEmail = require('./mailer');

mongoose.Promise = global.Promise;

let User = null;
let ResetPasswordRequest = null;
let ConfirmEmailRequest = null;

const pepper = process.env.PASSWORD_PEPPER || '2gvwvipSzbz2fopQyipsVX0RZK9thHUv';

function checkPassword(password) {
	const minPasswordLength = Number(process.env.MIN_PASSWORD_LENGTH || 6);
	if ((password || '').length < minPasswordLength) {
		throw new Error(`Password length should be at least ${minPasswordLength} symbols`);
	}
}

const UserSchema = new mongoose.Schema({
	email: {type: String, required: true, index: true, unique: true},
	name: {type: String, required: true, index: true},
	passwordHash: {type: String, required: true},
	emailConfirmed: {type: Boolean, required: true, default: false, index: true},
	sipUri: {type: String, required: true, index: true},
	servicePhoneNumber: {type: String, required: true, index: true},
	endpointId: {type: String, required: true}
});

UserSchema.methods.setPassword = function (password) {
	return new Promise((resolve, reject) => {
		hash(password + pepper, 10, (err, hash) => {
			if (err) {
				return reject(err);
			}
			this.passwordHash = hash;
			return resolve(hash);
		});
	});
};

UserSchema.methods.comparePasswords = function (password) {
	return new Promise((resolve, reject) => {
		compare(password + pepper, this.passwordHash, (err, result) => {
			if (err) {
				return reject(err);
			}
			return resolve(result);
		});
	});
};

UserSchema.statics.checkUser = async (userName, password) => {
	const user = await User.findOne({$or: [{name: userName}, {email: userName}], emailConfirmed: true});
	if (user && (await user.comparePasswords(password))) {
		return user;
	}
	throw new Error('Missing user with such email/name or password');
};

UserSchema.statics.registerUser = async userData => {
	let user = await User.findOne({email: userData.email}).select('_id');
	if (user) {
		throw new Error('User with such email is registered already');
	}
	const password = userData.password;
	checkPassword(userData.password);
	delete userData.password;
	user = new User(userData);
	await user.setPassword(password);
	await user.save();
	return user;
};

if (!UserSchema.options.toJSON) {
	UserSchema.options.toJSON = {};
}

UserSchema.options.toJSON.transform = (doc, ret) => {
	ret.id = ret._id.toString();
	delete ret._id;
	delete ret.passwordHash;
	return ret;
};

User = mongoose.model('User', UserSchema);

const ResetPasswordRequestSchema = new mongoose.Schema({
	createdAt: {type: Date, expires: 24 * 3600, default: Date.now},
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true}
});

ResetPasswordRequestSchema.statics.createRequest = async (email, host, protocol) => {
	const user = await User.findOne({email});
	if (!user) {
		throw new Error('Invalid request');
	}
	const request = new ResetPasswordRequest({user});
	await request.save();
	await sendEmail(user.email, {
		subject: 'Honeypot - reset password',
		html: `Follow <a href="${protocol}://${host}/#/reset-password/${request.id}">this link</a> to reset your password.`
	});
	return request;
};

ResetPasswordRequestSchema.statics.resetPassword = async (token, password) => {
	const request = await ResetPasswordRequest.findById(token).populate('user');
	if (!request || !request.user) {
		throw new Error('Invalid request');
	}
	checkPassword(password);
	const user = request.user;
	await user.setPassword(password);
	await user.save();
	await request.remove();
	return user;
};

ResetPasswordRequest = mongoose.model('ResetPasswordRequest', ResetPasswordRequestSchema);

const ConfirmEmailRequestSchema = new mongoose.Schema({
	createdAt: {type: Date, expires: 24 * 3600, default: Date.now},
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true}
});

ConfirmEmailRequestSchema.statics.createRequest = async (user, host, protocol) => {
	const request = new ConfirmEmailRequest({user});
	await request.save();
	await sendEmail(user.email, {
		subject: 'Click-to-call - confirm your email',
		html: `Follow <a href="${protocol}://${host}/confirm-email/${request.id}">this link</a> to confirm your email`
	});
	return request;
};

ConfirmEmailRequestSchema.statics.confirmEmail = async token => {
	const request = await ConfirmEmailRequest.findById(token).populate('user');
	if (!request || !request.user) {
		throw new Error('Invalid request');
	}
	const user = request.user;
	user.emailConfirmed = true;
	await user.save();
	await request.remove();
	return user.toJSON();
};

ConfirmEmailRequest = mongoose.model('ConfirmEmailRequest', ConfirmEmailRequestSchema);

const ButtonSchema = new mongoose.Schema({
	number: {type: String, required: true},
	enabled: {type: Boolean, default: true, index: true},
	deleted: {type: Boolean, default: false, index: true},
	tokenTTL: {type: Number, default: 60},
	createdAt: {type: Date, default: Date.now, index: true},
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true}
});


if (!ButtonSchema.options.toJSON) {
	ButtonSchema.options.toJSON = {};
}

ButtonSchema.options.toJSON.transform = (doc, ret) => {
	ret.id = ret._id.toString();
	delete ret._id;
	return ret;
};

const CallTrackingSchema = new mongoose.Schema({
	createdAt: {type: Date, default: Date.now, index: true},
	answeredAt: {type: Date, index: true},
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true},
	button: {type: mongoose.Schema.Types.ObjectId, ref: 'Button', index: true},
	token: {type: String, required: true, index: true},
	duration: {type: Number, default: 0},
	completed: {type: Boolean, default: false, index: true},
	transcribedText: {type: String},
	mediaName: {type: String},
	callIds: {type: [], index: true}
});

if (!CallTrackingSchema.options.toJSON) {
	CallTrackingSchema.options.toJSON = {};
}

CallTrackingSchema.options.toJSON.transform = (doc, ret) => {
	ret.id = ret._id.toString();
	delete ret._id;
	delete ret.user;
	return ret;
};


module.exports = {
	User,
	ResetPasswordRequest,
	ConfirmEmailRequest,
	Button: mongoose.model('Button', ButtonSchema),
	CallTracking: mongoose.model('CallTracking', CallTrackingSchema)
};
