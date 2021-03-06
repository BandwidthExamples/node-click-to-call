const {Readable} = require('stream');
const Router = require('koa-router');
const mongoose = require('mongoose');
const SSEStream = require('sse_stream');
const debug = require('debug')('routes');
const {phoneNumber} = require('@bandwidth/node-bandwidth-extra');
const passport = require('koa-passport');
const authenticated = require('./authenticated');
const getRedisClient = require('./redis');
const {User, ConfirmEmailRequest, ResetPasswordRequest, Button, CallTracking} = require('./models');

const objectId = mongoose.Types.ObjectId;

const router = new Router();

function checkPasswords(data) {
	if (!data || data.password !== data.repeatPassword) {
		throw new Error('Passwords are mismatched');
	}
}

router.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		debug(err.stack);
		ctx.body = {error: err.message};
	}
});

router.get('/profile', ctx => {
	ctx.body = ctx.state.user || {};
});

router.post('/profile', authenticated, async ctx => {
	const {user} = ctx.state;
	const data = ctx.request.body;
	if (data.password && data.oldPassword) {
		if (!await user.comparePasswords(data.oldPassword)) {
			throw new Error('Invalid current password');
		}
		checkPasswords(data);
		await user.setPassword(data.password);
	}
	await user.save();
	ctx.body = user;
});

router.post('/login', passport.authenticate('local'), ctx => {
	ctx.body = {};
});

router.post('/logout', async ctx => {
	await ctx.logout();
	ctx.body = {};
});

router.post('/register', async ctx => {
	const data = ctx.request.body;
	checkPasswords(data);
	const sipName = data.email.replace(/[@.]/gi, '_');
	const endpoint = await ctx.getOrCreateEndpoint(sipName);
	data.sipUri = endpoint.sipUri;
	data.endpointId = endpoint.id;
	data.servicePhoneNumber = await phoneNumber.getOrCreatePhoneNumber(ctx.bandwidthApi, ctx.applicationId, {name: sipName, areaCode: process.env.AREA_CODE || '910'});
	const user = await User.registerUser(data);
	await ConfirmEmailRequest.createRequest(user, ctx.host, ctx.protocol);
	ctx.body = {};
});

router.get('/confirm-email/:token', async ctx => {
	const user = await ConfirmEmailRequest.confirmEmail(ctx.params.token);
	await ctx.login(user);
	return ctx.redirect('/');
});

router.post('/reset-password-request', async ctx => {
	await ResetPasswordRequest.createRequest(ctx.request.body.email, ctx.host, ctx.protocol);
	ctx.body = {};
});

router.post('/reset-password/:token', async ctx => {
	const data = ctx.request.body;
	checkPasswords(data);
	await ResetPasswordRequest.resetPassword(ctx.params.token, data.password);
	ctx.body = {};
});

router.get('/buttons', authenticated, async ctx => {
	ctx.body = await Button.find({user: objectId(ctx.state.user.id)}).sort({createdDate: -1, deleted: 1});
});

router.post('/buttons', authenticated, async ctx => {
	const button = new Button(ctx.request.body);
	button.user = ctx.state.user;
	await button.save();
	ctx.body = button;
});

router.del('/buttons/:id', authenticated, async ctx => {
	await Button.update({_id: objectId(ctx.params.id), user: objectId(ctx.state.user.id)}, {$set: {deleted: true}});
	ctx.body = {};
});

router.post('/buttons/:id', authenticated, async ctx => {
	await Button.update({_id: objectId(ctx.params.id), user: objectId(ctx.state.user.id), deleted: false}, {$set: {enabled: Boolean(ctx.request.body.enabled)}});
	ctx.body = {};
});

router.get('/buttons/:id/calls', authenticated, async ctx => {
	const page = Number(ctx.query.page || 1);
	const size = Number(ctx.query.size || 15);
	const query = {button: objectId(ctx.params.id), user: objectId(ctx.state.user.id)};
	ctx.body = {
		page,
		pageCount: Math.ceil((await CallTracking.count(query)) / size),
		size,
		calls: await CallTracking.find(query).skip((page - 1) * size).limit(size).sort({createdDate: -1})
	};
});

router.get('/buttons/:id/calls/:trackingId/audio', authenticated, async ctx => {
	const tracking = await CallTracking.findOne({_id: objectId(ctx.params.trackingId), button: objectId(ctx.params.id)});
	if (!tracking || !tracking.mediaName) {
		return ctx.throw(404);
	}
	const {contentType, content} = await ctx.bandwidthApi.Media.download(tracking.mediaName);
	ctx.type = contentType;
	ctx.body = content;
});

router.options('/buttons/:id/click', async ctx => {
	debug(`Click handler options ${ctx.origin}`);
	ctx.set('Access-Control-Allow-Origin', ctx.origin);
	ctx.set('Vary', 'Origin');
	ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	ctx.body = '';
});

router.post('/buttons/:id/click', async ctx => {
	debug('Click handler');
	const button = await Button.findOne({_id: objectId(ctx.params.id), enabled: true, deleted: false}).populate('user');
	if (!button) {
		return ctx.throw(404, 'Invalid button id');
	}
	debug('Creating auth token');
	const {user} = button;
	const {token} = await ctx.bandwidthApi.Endpoint.createAuthToken(ctx.domainId, user.endpointId, {expires: 3600});
	const trackingItem = new CallTracking({user, button, token});
	await trackingItem.save();
	ctx.set('Access-Control-Allow-Origin', '*');
	ctx.set('Vary', 'Origin');
	ctx.body = {id: trackingItem.id, token, sipUri: user.sipUri, number: button.number};
});

class SimpleReadable extends Readable {
	_read() {
	}
}

router.get('/buttons/sse', async ctx => {
	const {req} = ctx;
	const stream = new SimpleReadable({objectMode: true});
	const redis = getRedisClient();
	ctx.set('Cache-Control', 'no-cache');
	ctx.set('Connection', 'keep-alive');
	ctx.type = 'text/event-stream';
	redis.on('message', (channel, message) => stream.push(message));
	redis.subscribe(`CallTracking.${ctx.query.id}`);
	stream.push('');
	ctx.body = stream.pipe(new SSEStream());
	const close = () => {
		redis.quit();
		req.socket.removeListener('error', close);
		req.socket.removeListener('close', close);
	};
	req.socket.on('error', close);
	req.socket.on('close', close);
});

module.exports = router;
