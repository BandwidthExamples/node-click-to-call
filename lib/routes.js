const Router = require('koa-router');
const debug = require('debug')('routes');
const {User, ConfirmEmailRequest, ResetPasswordRequest} = require('./models');

const router = new Router();

function checkPasswords(data) {
	if (!data || data.password !== data.repeatPassword) {
		throw new Error('Passwords are mismatched');
	}
}

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


module.exports = router;
