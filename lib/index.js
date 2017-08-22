const path = require('path');
const crypto = require('crypto');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const send = require('koa-send');
const koaSession = require('koa-session');
const passport = require('koa-passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const {middlewares} = require('@bandwidth/node-bandwidth-extra');

dotenv.load();

const router = require('./routes');
const {User, CallTracking} = require('./models');

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
				if (data.eventType === 'answer') {
					let user = null;
					if (data.from.startsWith('sip:')){
						user = await User.findOne({sipUri: data.from});
					}
					if (user) {
						await ctx.bandwidthApi.Call.playAudioAdvanced(data.callId, {
							fileUrl: `${ctx.protocol}://${ctx.host}/public/ring.mp3`,
							loopEnabled: true
						});
						const anotherCallId = await ctx.bandwidthApi.Call.create({from: user.servicePhoneNumber, to: data.to});
						await ctx.bandwidthApi.Bridge.create({
							bridgeAudio: true,
							callIds: [anotherCallId, data.callId]
						});
						const call = await ctx.bandwidthApi.Call.get(data.callId);
						const trackingId = call.sipHeaders['X-TRACKING-ID'];
						const tracking = CallTracking.findById(trackingId);
						if (tracking) {
							tracking.callIds = [anotherCallId, data.callId];
							await tracking.save();
						}
					} else {
						const tracking = CallTracking.findOne({callIds: data.callId});
						tracking.answeredAt = Date.now();
						await tracking.save();
						const anotherCallId = tracking.callIds.filter(id => id === data.callId)[0];
						await ctx.bandwidthApi.Call.playAudioAdvanced(anotherCallId, {fileUrl: ''});
					}
				}
				if (data.eventType === 'hangup') {
					const tracking = CallTracking.findOne({callIds: data.callId});
					if (tracking) {
						await Promise.all(tracking.callIds.filter(id => id !== data.callId).map(id => ctx.bandwidthApi.Call.hangup(id)));
					}
				}
			}
		}))
		.use(passport.initialize())
		.use(passport.session())
		.use(router.routes())
		.use(router.allowedMethods())
		.use(koaStatic(rootPath))
		.use(async ctx => {
			ctx.body = await send(ctx, path.join(rootPath, 'index.html'));
		});
	return app;
}

module.exports = main;
