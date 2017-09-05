const test = require('ava');
const td = require('testdouble');
const passport = require('koa-passport');

td.replace('../lib/redis');

const {User, ConfirmEmailRequest, ResetPasswordRequest} = require('../lib/models');

td.replace(User, 'findOne');
td.replace(User, 'registerUser');
td.when(User.findOne({email: 'user1@test.com'})).thenResolve();
td.when(User.findOne({email: 'user2@test.com'})).thenResolve(new User());
td.when(User.registerUser({
	email: 'user3@test.com',
	password: '123456',
	repeatPassword: '123456'
})).thenResolve(new User({email: 'user3@test.com'}));

td.replace(ConfirmEmailRequest, 'createRequest');
td.replace(ConfirmEmailRequest, 'confirmEmail');
td.when(ConfirmEmailRequest.createRequest(td.matchers.anything(), 'localhost', 'http')).thenResolve();
const confirmedUser = new User();
td.when(ConfirmEmailRequest.confirmEmail('token')).thenResolve(confirmedUser);

td.replace(ResetPasswordRequest, 'createRequest');
td.replace(ResetPasswordRequest, 'resetPassword');
td.when(ResetPasswordRequest.createRequest('user4@test.com', 'localhost', 'http')).thenResolve();
td.when(ResetPasswordRequest.resetPassword('token', '111111')).thenResolve();

td.replace(passport, 'authenticate');
td.when(passport.authenticate('local')).thenReturn((ctx, next) => next());

const routes = require('../lib/routes').routes();

test('GET /profile should return profile data', async t => {
	const ctx = {
		state: {user: {}},
		isAuthenticated: () => true,
		method: 'GET',
		path: '/profile'
	};
	await routes(ctx, null);
	t.deepEqual(ctx.body, {});
});

test('POST /profile should update profile data', async t => {
	const user = new User();
	user.save = td.function();
	td.when(user.save()).thenResolve();
	await user.setPassword('1111111111');
	const ctx = {
		state: {user},
		isAuthenticated: () => true,
		method: 'POST',
		path: '/profile',
		request: {
			body: {
				name: 'user1',
				password: '1234567890',
				repeatPassword: '1234567890',
				oldPassword: '1111111111'
			}
		}
	};
	await routes(ctx, null);
	t.true(await user.comparePasswords('1234567890'));
	t.is(ctx.body, user);
});

test('POST /profile should fail if passwords are mismatched', async t => {
	const user = new User();
	await user.setPassword('1111111111');
	const ctx = {
		state: {user},
		isAuthenticated: () => true,
		method: 'POST',
		path: '/profile',
		request: {
			body: {
				password: '1234567890',
				repeatPassword: '1234567891',
				oldPassword: '1111111111'
			}
		}
	};
	await routes(ctx, null);
	t.truthy(ctx.body.error);
});

test('POST /profile should fail if old password is wrong', async t => {
	const user = new User();
	await user.setPassword('1111111111');
	const ctx = {
		state: {user},
		isAuthenticated: () => true,
		method: 'POST',
		path: '/profile',
		request: {
			body: {
				password: '1234567890',
				repeatPassword: '1234567890',
				oldPassword: '1111111110'
			}
		}
	};
	await routes(ctx, null);
	t.truthy(ctx.body.error);
});

test('POST /login should authentificate user via passport', async t => {
	const ctx = {
		state: {},
		isAuthenticated: () => false,
		method: 'POST',
		path: '/login',
		request: {
			body: {
				email: 'test@test.com',
				password: '111111'
			}
		}
	};
	await routes(ctx, null);
	t.truthy(ctx.body);
});

test('POST /logout should call logout()', async t => {
	const ctx = {
		state: {user: {}},
		isAuthenticated: () => true,
		method: 'POST',
		path: '/logout',
		request: {
			body: {}
		},
		logout: td.function()
	};
	td.when(ctx.logout(), {times: 1}).thenResolve();
	await routes(ctx, null);
	t.truthy(ctx.body);
});

test('POST /register should register new user', async t => {
	const ctx = {
		state: {},
		isAuthenticated: () => false,
		method: 'POST',
		path: '/register',
		request: {
			body: {name: 'user3', email: 'user3@test.com', password: '123456', repeatPassword: '123456'}
		},
		host: 'localhost',
		protocol: 'http'
	};
	await routes(ctx, null);
	t.truthy(ctx.body);
});

test('GET /confirm-email/:token should complete user registering', async t => {
	const ctx = {
		state: {},
		isAuthenticated: () => false,
		method: 'GET',
		path: '/confirm-email/token',
		login: td.function(),
		redirect: td.function()
	};
	td.when(ctx.login(confirmedUser)).thenResolve();
	td.when(ctx.redirect('/')).thenReturn();
	await routes(ctx, null);
	t.pass();
});

test('POST /reset-password-request should send request to reset password', async t => {
	const ctx = {
		state: {},
		isAuthenticated: () => false,
		method: 'POST',
		path: '/reset-password-request',
		request: {
			body: {email: 'user4@test.com'}
		},
		host: 'localhost',
		protocol: 'http'
	};
	await routes(ctx, null);
	t.truthy(ctx.body);
});

test('POST /reset-password/:token should reset a password', async t => {
	const ctx = {
		state: {},
		isAuthenticated: () => false,
		method: 'POST',
		path: '/reset-password/:token',
		request: {
			body: {password: '111111', repeatPassword: '111111'}
		},
		host: 'localhost',
		protocol: 'http'
	};
	await routes(ctx, null);
	t.truthy(ctx.body);
});
