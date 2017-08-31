const path = require('path');
const crypto = require('crypto');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaSend = require('koa-send');
const koaStatic = require('koa-static');
const koaSession = require('koa-session');
const passport = require('koa-passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const debug = require('debug')('index');
const {middlewares} = require('@bandwidth/node-bandwidth-extra');

dotenv.load();

const router = require('./routes');
const {User, CallTracking} = require('./models');

const objectId = mongoose.Types.ObjectId;

async function main() {
	mongoose.Promise = global.Promise;
	await mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost/click-to-call');
	passport
		.use(new LocalStrategy({usernameField: 'email'}, (userName, password, done) => User.checkUser(userName, password).then(user => done(null, user), done)));
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});
	passport.deserializeUser((userId, done) => {
		User.findById(userId).then(user => {
			done(null, user);
		}, done);
	});

	const app = new Koa();
	app.keys = (process.env.COOKIES_KEYS || '8ZnrWgB8XjOdzrApG9e7ZPINj3OlIWEY').split(';');
	app.proxy = true;
	const {BANDWIDTH_USER_ID, BANDWIDTH_API_TOKEN, BANDWIDTH_API_SECRET} = process.env;
	const domainName = `c${crypto.createHash('md5').update(BANDWIDTH_USER_ID + BANDWIDTH_API_TOKEN + BANDWIDTH_API_SECRET).digest('hex').substr(0, 14)}`;
	const rootPath = path.join(__dirname, '..', 'frontend', 'build');
	app
		.use(koaBody({multipart: true}))
		.use(koaSession(app))
		.use(middlewares.koa({
			name: 'Click-to-call',
			auth: {userId: BANDWIDTH_USER_ID, apiToken: BANDWIDTH_API_TOKEN, apiSecret: BANDWIDTH_API_SECRET},
			sip: {
				domain: domainName
			},
			callCallback: async (data, ctx) => {
				let sipHeaders = data.sipHeaders;
				if (!sipHeaders) {
					const call = await ctx.bandwidthApi.Call.get(data.callId);
					sipHeaders = call.sipHeaders;
				}
				debug('SIP headers: %j', sipHeaders);
				const trackingId = sipHeaders['X-Tracking-Id'];
				if (!trackingId) {
					return;
				}
				const tracking = await CallTracking.findById(objectId(trackingId)).populate('button').populate('user');
				if (!tracking || tracking.button.number !== data.to || !tracking.button.enabled || tracking.button.deleted) {
					return;
				}
				const user = tracking.user;
				if (data.eventType === 'answer') {
					debug(`Answered call for tracking id ${trackingId}`);
					if (user.sipUri === data.from) {
						debug(`Playing ring tones`);
						await ctx.bandwidthApi.Call.playAudioAdvanced(data.callId, {
							fileUrl: 'https://s3.amazonaws.com/bwdemos/media/ring.mp3',
							loopEnabled: true
						});
						debug(`Calling to destination number ${data.to}`);
						const anotherCallId = await ctx.bandwidthApi.Call.create({from: user.servicePhoneNumber, to: data.to, sipHeaders: {'X-Tracking-Id': trackingId}});
						debug('Bridging calls %j', [anotherCallId, data.callId]);
						await ctx.bandwidthApi.Bridge.create({
							bridgeAudio: true,
							callIds: [anotherCallId, data.callId]
						});
						tracking.callIds = [anotherCallId, data.callId];
						await tracking.save();
					}
					if (user.servicePhoneNumber === data.from) {
						debug(`Answered another leg (call id ${data.callId})`);
						tracking.answeredAt = Date.now();
						await tracking.save();
						const anotherCallId = tracking.callIds.filter(id => id !== data.callId)[0];
						debug(`Stop playing ring tones (call id ${anotherCallId})`);
						await ctx.bandwidthApi.Call.playAudioAdvanced(anotherCallId, {fileUrl: ''});
					}
				}
				if (data.eventType === 'hangup') {
					if (!tracking.completed) {
						debug(`Hangup call ${data.callId}`);
						await Promise.all((tracking.callIds || []).filter(id => id !== data.callId).map(id => ctx.bandwidthApi.Call.hangup(id)));
						tracking.completed = true;
						await tracking.save();
					}
				}
			}
		}))
		.use(passport.initialize())
		.use(passport.session())
		.use(router.routes())
		.use(router.allowedMethods())
		.use(koaStatic(rootPath))
		.use(async (ctx, next) => {
			if (ctx.method === 'GET') {
				// SPA support
				await koaSend(ctx, 'index.html', {root: rootPath});
				return;
			}
			await next();
		});
	return app;
}

module.exports = main;
