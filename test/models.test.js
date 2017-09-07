const test = require('ava');
const td = require('testdouble');

const mockRedis = {
	publish: td.function()
};
td.replace('../lib/redis', () => mockRedis);

const mockSendMail = td.replace('../lib/mailer');
const {User, ResetPasswordRequest, ConfirmEmailRequest, CallTracking, callTrackingPostSave} = require('../lib/models');

td.replace(User, 'findOne');
td.replace(User.prototype, 'save');
td.replace(ResetPasswordRequest.prototype, 'save');
td.replace(ResetPasswordRequest, 'findById');
td.replace(ConfirmEmailRequest.prototype, 'save');
td.replace(ConfirmEmailRequest, 'findById');

test('User#setPassword() should set password', async t => {
	const user = new User();
	await user.setPassword('1234567890');
	t.true(user.passwordHash.length > 0);
});

test('User#comparePasswords() should compare passwords', async t => {
	const user = new User();
	await user.setPassword('1234567890');
	t.true(await user.comparePasswords('1234567890'));
});

test('User#checkUser() should compare user name and password', async t => {
	const user = new User();
	await user.setPassword('1234567890');
	td.when(User.findOne({email: 'user', emailConfirmed: true})).thenResolve(user);
	t.is(await User.checkUser('user', '1234567890'), user);
});

test('User#checkUser() should fail if password is invalid', async t => {
	const user = new User();
	await user.setPassword('1234567890');
	td.when(User.findOne({email: 'user1', emailConfirmed: true})).thenResolve(user);
	await t.throws(User.checkUser('user1', '0123456789'));
});

test('User#checkUser() should fail if user is invalid', async t => {
	const user = new User();
	await user.setPassword('1234567890');
	td.when(User.findOne({email: 'user2', emailConfirmed: true})).thenResolve(user);
	await t.throws(User.checkUser('another-user', '1234567890'));
});

test.serial('User#registerUser() should create new user', async t => {
	td.when(User.findOne({email: 'test@test.com'})).thenReturn({
		select: () => Promise.resolve(null)
	});
	td.when(User.prototype.save()).thenResolve();
	const user = await User.registerUser({
		email: 'test@test.com',
		password: '1234567890'
	});
	t.is(user.email, 'test@test.com');
	t.true(user.passwordHash.length > 0);
});

test.serial('User#registerUser() should throw error if user is exists already', async t => {
	td.when(User.findOne({email: 'test@test.com'})).thenReturn({
		select: () => Promise.resolve(new User())
	});
	td.when(User.prototype.save(), {times: 0});
	await t.throws(User.registerUser({
		name: 'user',
		email: 'test@test.com',
		password: '1234567890'
	}));
});

test('User#toJSON() should return  data without password', async t => {
	const user = new User({email: 'test@test.com'});
	await user.setPassword('1234567890');
	const usr = user.toJSON();
	t.truthy(usr.id);
	t.falsy(usr.passwordHash);
});

test('ResetPasswordRequest#createRequest() should send email notification to user', async t => {
	const user = new User({email: 'test@test.com'});
	td.when(User.findOne({email: 'test@test.com'})).thenResolve(user);
	td.when(mockSendMail('test@test.com', td.matchers.argThat(m => m.html.indexOf('http://localhost/#/reset-password/id') >= 0))).thenResolve();
	td.when(ResetPasswordRequest.prototype.save()).thenDo(function () {
		this.id = 'id';
		return Promise.resolve();
	});
	const request = await ResetPasswordRequest.createRequest('test@test.com', 'localhost', 'http');
	t.is(request.user, user);
});

test('ResetPasswordRequest#createRequest() should fail if user with given email is not found', async t => {
	td.when(User.findOne({email: 'test1@test.com'})).thenResolve(null);
	await t.throws(ResetPasswordRequest.createRequest('test1@test.com', 'localhost', 'http'));
});

test('ResetPasswordRequest#resetPassword() should change password of user', async t => {
	const user = new User({email: 'test2@test.com'});
	const request = new ResetPasswordRequest({user});
	request.remove = td.function();
	user.save = td.function();
	td.when(ResetPasswordRequest.findById('token')).thenReturn({populate: () => Promise.resolve(request)});
	td.when(request.remove()).thenResolve();
	td.when(request.save()).thenResolve();
	await ResetPasswordRequest.resetPassword('token', '1234567890');
	t.true(await user.comparePasswords('1234567890'));
});

test('ResetPasswordRequest#resetPassword() should fail if request is not found', async t => {
	td.when(ResetPasswordRequest.findById('token1')).thenReturn({populate: () => Promise.resolve(null)});
	await t.throws(ResetPasswordRequest.resetPassword('token1', '1234567890'));
});

test('ConfirmEmailRequest#createRequest() should send email notification to user', async t => {
	const user = new User({email: 'test3@test.com'});
	td.when(User.findOne({email: 'test3@test.com'})).thenResolve(user);
	td.when(mockSendMail('test3@test.com', td.matchers.argThat(m => m.html.indexOf('http://localhost/confirm-email/id') >= 0))).thenResolve();
	td.when(ConfirmEmailRequest.prototype.save()).thenDo(function () {
		this.id = 'id';
		return Promise.resolve();
	});
	const request = await ConfirmEmailRequest.createRequest(user, 'localhost', 'http');
	t.is(request.user, user);
});

test('ConfirmEmailRequest#createRequest() should fail if user with given email is not found', async t => {
	td.when(User.findOne({email: 'test4@test.com'})).thenResolve(null);
	await t.throws(ResetPasswordRequest.createRequest(new User({email: 'test4@test.com'}), 'localhost', 'http'));
});

test('ConfirmEmailRequest#confirmEmail() should confirm email of user', async t => {
	const user = new User({email: 'test5@test.com'});
	const request = new ConfirmEmailRequest({user});
	request.remove = td.function();
	user.save = td.function();
	td.when(ConfirmEmailRequest.findById('token')).thenReturn({populate: () => Promise.resolve(request)});
	td.when(request.remove()).thenResolve();
	td.when(request.save()).thenResolve();
	await ConfirmEmailRequest.confirmEmail('token');
	t.true(user.emailConfirmed);
});

test('CallTracking#toJSON() should return data without token', t => {
	const tracking = new CallTracking({token: '1234'});
	const tr = tracking.toJSON();
	t.truthy(tr.id);
	t.falsy(tr.token);
});

test.cb('CallTracking#save() should publish a message to redis', t => {
	const data = {token: '1234', user: 'userId'};
	data.toJSON = () => data;
	td.when(mockRedis.publish(`CallTracking.userId`, JSON.stringify(data))).thenReturn();
	setTimeout(() => {
		callTrackingPostSave(data);
		t.end();
	}, 20);
});
