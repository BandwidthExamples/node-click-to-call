const test = require('ava');
const td = require('testdouble');
const redis = require('redis');

td.replace(redis, 'createClient');
td.when(redis.createClient(td.matchers.anything())).thenReturn({});

const getClient = require('../lib/redis');

test('should return redis client', t => {
	t.truthy(getClient());
});
