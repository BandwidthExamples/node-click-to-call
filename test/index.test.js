const test = require('ava');
const fs = require('mz/fs');
const td = require('testdouble');
const supertest = require('supertest');
const mongoose = require('mongoose');
const {middlewares} = require('@bandwidth/node-bandwidth-extra');

td.replace('../lib/redis');

process.env.BANDWIDTH_USER_ID = 'userId';
process.env.BANDWIDTH_API_TOKEN = 'token';
process.env.BANDWIDTH_API_SECRET = 'secret';

td.replace(middlewares, 'koa');
td.replace(mongoose, 'connect');

const main = require('../lib/index');

test.before(async () => {
	if (!(await fs.exists('./frontend/build/index.html'))) {
		try {
			await fs.mkdir('./frontend/build/');
		} catch (err) {
		}
		await fs.writeFile('./frontend/build/index.html', ' ');
	}
});

test('GET / should render index page', async t => {
	td.when(middlewares.koa(td.matchers.anything())).thenReturn((ctx, next) => next());
	const app = await main();
	await supertest(app.callback()).get('/')
		.expect(200)
		.expect('Content-Type', /html/);
	t.pass();
});
