const util = require('util');
const test = require('ava');
const td = require('testdouble');
const mongoose = require('mongoose');

const mockRedis = {
	on: td.function(),
	subscribe: td.function()
};
td.replace('../lib/redis', () => mockRedis);

mongoose.Types.ObjectId = x => x.toString();

const {Button, CallTracking} = require('../lib/models');

td.replace(Button, 'find');
td.replace(Button, 'findOne');
td.replace(Button, 'update');
td.replace(Button.prototype, 'save');
td.replace(CallTracking, 'find');
td.replace(CallTracking, 'findOne');
td.replace(CallTracking, 'count');
td.replace(CallTracking.prototype, 'save');

const routes = require('../lib/routes').routes();

test('GET /buttons should buttons of user', async t => {
	const ctx = {
		state: {user: {id: 'userId'}},
		isAuthenticated: () => true,
		method: 'GET',
		path: '/buttons'
	};
	const mockSort = {
		sort: td.function()
	};
	td.when(Button.find({user: 'userId'})).thenReturn(mockSort);
	td.when(mockSort.sort({createdDate: -1, deleted: 1})).thenResolve([{}]);
	await routes(ctx, null);
	t.is(ctx.body.length, 1);
});

test('POST /buttons should create new button', async t => {
	const ctx = {
		state: {user: {id: 'userId'}},
		isAuthenticated: () => true,
		method: 'POST',
		path: '/buttons',
		request: {
			body: {
				number: '+1234567890'
			}
		}
	};
	td.when(Button.prototype.save()).thenResolve();
	await routes(ctx, null);
	t.truthy(ctx.body.id);
});

test('DELETE /buttons/:id should mark a button as deleted', async t => {
	const ctx = {
		state: {user: {id: 'userId'}},
		isAuthenticated: () => true,
		method: 'DELETE',
		path: '/buttons/id'
	};
	td.when(Button.update({_id: 'id', user: 'userId'}, {$set: {deleted: true}})).thenResolve();
	await routes(ctx, null);
	t.pass();
});

test('POST /buttons/:id should updated filed "enabled"', async t => {
	const ctx = {
		state: {user: {id: 'userId'}},
		isAuthenticated: () => true,
		method: 'POST',
		path: '/buttons/id1',
		request: {
			body: {
				enabled: 'true'
			}
		}
	};
	td.when(Button.update({_id: 'id1', user: 'userId', deleted: false}, {$set: {enabled: true}})).thenResolve();
	await routes(ctx, null);
	t.pass();
});

test('GET /buttons/:id/calls should return tracking data of button', async t => {
	const ctx = {
		state: {user: {id: 'userId'}},
		isAuthenticated: () => true,
		method: 'GET',
		path: '/buttons/id/calls',
		query: {}
	};
	td.when(CallTracking.count({button: 'id', user: 'userId'})).thenResolve(1);
	td.when(CallTracking.find({button: 'id', user: 'userId'})).thenReturn({skip: () => ({
		limit: () => ({
			sort: () => Promise.resolve([{id: 'trackingId'}])
		})
	})});
	await routes(ctx, null);
	t.deepEqual(ctx.body, {
		page: 1,
		size: 15,
		pageCount: 1,
		calls: [{id: 'trackingId'}]
	});
});

test('GET /buttons/:id/calls/:trackingId/audio should downloaded recorded audio of call', async t => {
	const ctx = {
		state: {user: {id: 'userId'}},
		isAuthenticated: () => true,
		method: 'GET',
		path: '/buttons/id1/calls/trackingId1/audio',
		query: {},
		bandwidthApi: {
			Media: {
				download: td.function()
			}
		}
	};
	td.when(CallTracking.findOne({_id: 'trackingId1', button: 'id1'})).thenReturn({mediaName: 'file.mp3'});
	td.when(ctx.bandwidthApi.Media.download('file.mp3')).thenResolve({contentType: 'audio/mp3', content: Buffer.from('000')});
	await routes(ctx, null);
	t.is(ctx.type, 'audio/mp3');
	t.is(ctx.body.toString(), '000');
});

test('GET /buttons/:id/calls/:trackingId/audio should return 404 if audio is not recorded', async t => {
	const ctx = {
		state: {user: {id: 'userId'}},
		isAuthenticated: () => true,
		method: 'GET',
		path: '/buttons/id2/calls/trackingId2/audio',
		query: {},
		throw: td.function()
	};
	td.when(CallTracking.findOne({_id: 'trackingId2', button: 'id2'})).thenReturn({});
	td.when(ctx.throw(404)).thenReturn();
	await routes(ctx, null);
	t.pass();
});

test('OPTIONS /buttons/:id/click should return right CORS options', async t => {
	const ctx = {
		method: 'OPTIONS',
		path: '/buttons/id/click',
		origin: 'http://localhost',
		set: td.function()
	};
	td.when(ctx.set('Access-Control-Allow-Origin', ctx.origin)).thenReturn();
	td.when(ctx.set('Vary', 'Origin')).thenReturn();
	td.when(ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS')).thenReturn();
	await routes(ctx, null);
	t.pass();
});

test('POST /buttons/:id/click should return sip auth data to begin call on client side', async t => {
	const ctx = {
		method: 'POST',
		domainId: 'domainId',
		path: '/buttons/id/click',
		set: td.function(),
		bandwidthApi: {
			Endpoint: {
				createAuthToken: td.function()
			}
		}
	};
	td.when(ctx.set('Access-Control-Allow-Origin', '*')).thenReturn();
	td.when(ctx.set('Vary', 'Origin')).thenReturn();
	td.when(Button.findOne({_id: 'id', enabled: true, deleted: false})).thenReturn({
		populate: () => Promise.resolve({
			user: {endpointId: 'endpointId', sipUri: 'sipUri'},
			number: '+12345678901'
		})
	});
	td.when(ctx.bandwidthApi.Endpoint.createAuthToken('domainId', 'endpointId', td.matchers.anything())).thenResolve({token: 'token'});
	td.when(CallTracking.prototype.save()).thenResolve();
	await routes(ctx, null);
	const {id, token, sipUri, number} = ctx.body;
	t.truthy(id);
	t.is(token, 'token');
	t.is(sipUri, 'sipUri');
	t.is(number, '+12345678901');
});

test('POST /buttons/:id/click should return 404 for disabled button', async t => {
	const ctx = {
		method: 'POST',
		domainId: 'domainId',
		path: '/buttons/id1/click',
		throw: td.function()
	};
	td.when(Button.findOne({_id: 'id1', enabled: true, deleted: false})).thenReturn({
		populate: () => Promise.resolve(null)
	});
	td.when(ctx.throw(404, td.matchers.anything())).thenReturn();
	await routes(ctx, null);
	t.pass();
});

test('GET /buttons/sse should return stream of server side events', async t => {
	const ctx = {
		method: 'GET',
		path: '/buttons/sse',
		query: {id: 'userId'},
		set: td.function(),
		req: {
			socket: {
				on: td.function(),
				removeListener: td.function()
			}
		}
	};
	td.when(mockRedis.subscribe('CallTracking.userId'));
	td.when(mockRedis.on('message', td.matchers.anything()));
	td.when(ctx.set('Cache-Control', 'no-cache'));
	td.when(ctx.set('Connection', 'keep-alive'));
	td.when(ctx.req.socket.on('error', td.matchers.anything()));
	td.when(ctx.req.socket.on('close', td.matchers.anything()));
	await routes(ctx, null);
	t.is(ctx.type, 'text/event-stream');
	t.true(util.isFunction(ctx.body.pipe));
});
