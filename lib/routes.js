const {Readable} = require('stream');
const Router = require('koa-router');
const SSEStream = require('sse_stream');
const debug = require('debug')('routes');
const {phoneNumber} = require('@bandwidth/node-bandwidth-extra');
const passport = require('koa-passport');
const authenticated = require('./authenticated');
const getRedisClient = require('./redis');
const {User, ConfirmEmailRequest, ResetPasswordRequest, Button, CallTracking} = require('./models');

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
	if (data.name) {
		const existingUser = await User.findOne({name: data.name});
		if (existingUser) {
			throw new Error('User with such name is exists already');
		}
		user.name = data.name;
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
	ctx.body = await Button.find({user: ctx.state.user.id}).sort({createdDate: -1});
});

router.post('/buttons', authenticated, async ctx => {
	const button = new Button(ctx.request.body);
	button.user = ctx.state.user;
	await button.save();
	ctx.body = button;
});

router.delele('/buttons/:id', authenticated, async ctx => {
	await Button.update({_id: ctx.params.id, user: ctx.state.user.id}, {$set: {deleted: true}});
	ctx.body = {};
});

router.post('/buttons/:id', authenticated, async ctx => {
	await Button.update({_id: ctx.params.id, user: ctx.state.user.id, deleted: false}, {$set: {enabled: Boolean(ctx.request.body.enabled)}});
	ctx.body = {};
});

router.get('/buttons/:id/calls', authenticated, async ctx => {
	const page = Number(ctx.query.page || 1);
	const size = Number(ctx.query.size || 20);
	ctx.body = {
		page,
		size,
		calls: await CallTracking.find({_id: ctx.params.id, user: ctx.state.user.id}).skip((page - 1) * size).limit(size).sort({createdDate: -1})
	};
});

router.post('/buttons/:id/click', async ctx => {
	const button = await Button.findOne({_id: ctx.params.id, enabled: true, deleted: false}).populate('user');
	if (!button) {
		return ctx.throw(new Error('Invalid button id'));
	}
	const {user} = button;
	const {token} = await ctx.bandwidthApi.Endpoint.createAuthToken(ctx.domainId, user.endpointId, {expires: 3600});
	const trackingItem = new CallTracking({user, button, token});
	await trackingItem.save();
	ctx.body = {id: trackingItem.id, token, sipUri: user.sipUri};
});

class SimpleReadable extends Readable {
	_read() {
	}
}

router.get('/buttons/sse', authenticated, async ctx => {
	const {user} = ctx.state;
	const {req} = ctx.req;
	const stream = new SimpleReadable();
	const redis = getRedisClient();
	req.setTimeout(Number.MAX_VALUE, () => { });
	ctx.set('Cache-Control', 'no-cache');
	ctx.set('Connection', 'keep-alive');
	ctx.type = 'text/event-stream';
	redis.on('message', (channel, message) => stream.push(message));
	redis.subscribe(`CallTracking.${user.id.toString()}`);
	ctx.body = stream.pipe(new SSEStream());
	const close = () => {
		redis.close();
		req.socket.removeListener('error', close);
		req.socket.removeListener('close', close);
	};
	req.socket.on('error', close);
	req.socket.on('close', close);
});

module.exports = router;
