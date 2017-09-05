const test = require('ava');
const td = require('testdouble');
const mongoose = require('mongoose');

td.replace('../lib/redis');

mongoose.Types.ObjectId = x => x.toString();

const {Button} = require('../lib/models');

td.replace(Button, 'find');
td.replace(Button.prototype, 'save');

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
