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
				const trackingId = await ctx.cache.wrap(`trackingId:${data.callId}`, async () => {
					const call = await ctx.bandwidthApi.Call.get(data.callId);
					const sipHeaders = call.sipHeaders;
					debug('SIP headers: %j', sipHeaders);
					return sipHeaders['X-Tracking-Id'];
				}, {ttl: 3600});
				if (!trackingId) {
					return;
				}
				const tracking = await CallTracking.findById(objectId(trackingId)).populate('button').populate('user');
				if (!tracking || !tracking.button.enabled || tracking.button.deleted) {
					return;
				}
				const user = tracking.user;
				if (data.eventType === 'answer') {
					if (tracking.button.number !== data.to) {
						return;
					}
					debug(`Answered call for tracking id ${trackingId}`);
					if (user.sipUri === data.from) {
						debug(`Playing ring tones`);
						await ctx.bandwidthApi.Call.playAudioAdvanced(data.callId, {
							fileUrl: 'https://s3.amazonaws.com/bwdemos/media/ring.mp3',
							loopEnabled: true
						});
						const callbackUrl = await ctx.cache.wrap(`callbackUrl:${ctx.applicationId}`, async () => {
							const application = await ctx.bandwidthApi.Application.get(ctx.applicationId);
							return application.incomingCallUrl;
						});
						debug(`Calling to destination number ${data.to} (callback url: ${callbackUrl})`);
						const anotherCallId = (await ctx.bandwidthApi.Call.create({
							from: user.servicePhoneNumber,
							to: data.to, callbackUrl,
							sipHeaders: {'X-Tracking-Id': trackingId},
							transcriptionEnabled: true,
							recordingEnabled: true
						})).id;
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
				if (data.eventType === 'recording' && data.status === 'complete') {
					const recording = await ctx.bandwidthApi.Recording.get(data.recordingId);
					const items = recording.media.split('/');
					const mediaName = items[items.length - 1];
					debug(`Saving media name ${mediaName}`);
					tracking.mediaName = mediaName;
					await tracking.save();
				}
				if (data.eventType === 'transcription' && data.status === 'completed') {
					const transcription = await ctx.bandwidthApi.Recording.getTranscription(data.recordingId, data.transcriptionId);
					debug('Saving transcribed text');
					tracking.transcribedText = transcription.text;
					await tracking.save();
				}
				if (data.eventType === 'hangup') {
					if (!tracking.completed) {
						debug(`Hangup call ${data.callId}`);
						await Promise.all((tracking.callIds || []).filter(id => id !== data.callId).map(id => ctx.bandwidthApi.Call.hangup(id)));
						tracking.completed = true;
						if (tracking.answeredAt) {
							tracking.duration = Math.round((Date.now() - Number(new Date(tracking.answeredAt)))/1000);
						}
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
