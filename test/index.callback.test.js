const test = require('ava');
const td = require('testdouble');
const supertest = require('supertest');
const mongoose = require('mongoose');
const {middlewares} = require('@bandwidth/node-bandwidth-extra');

td.replace('../lib/redis');

process.env.BANDWIDTH_USER_ID = 'userId';
process.env.BANDWIDTH_API_TOKEN = 'token';
process.env.BANDWIDTH_API_SECRET = 'secret';

const wrapPromise = result => {
	const promise = Promise.resolve(result);
	promise.populate = () => promise;
	return promise;
};

mongoose.Types.ObjectId = x => x.toString();

const {CallTracking} = require('../lib/models');

td.replace(middlewares, 'koa');
td.replace(mongoose, 'connect');
td.replace(CallTracking, 'findById');

const main = require('../lib/index');

let callCallback = null;

test.before(async () => {
	callCallback = null;
	td.when(middlewares.koa(td.matchers.anything())).thenDo(opts => {
		callCallback = opts.callCallback;
		return (ctx, next) => next();
	});
	const app = await main();
	await supertest(app.callback()).get('/');
});

test.beforeEach(t => {
	t.context.cache = {wrap: (key, factory) => factory()};
	t.context.bandwidthApi = {
		Call: {
			get: td.function(),
			create: td.function(),
			playAudioAdvanced: td.function(),
			hangup: td.function()
		},
		Recording: {
			get: td.function(),
			getTranscription: td.function()
		},
		Bridge: {
			create: td.function()
		},
		Application: {
			get: td.function()
		}
	};
	t.context.applicationId = 'applicationId';
});

test('should handle answer event', async t => {
	td.when(t.context.bandwidthApi.Call.get('callId')).thenResolve({
		sipHeaders: {'X-Tracking-Id': 'trackingId1'}
	});
	td.when(CallTracking.findById('trackingId1')).thenReturn(wrapPromise({
		user: {
			sipUri: 'sip:test@test.com',
			servicePhoneNumber: '0000'
		},
		button: {
			number: '+12345678900',
			enabled: true,
			deleted: false
		},
		save: () => Promise.resolve()
	}));
	td.when(t.context.bandwidthApi.Call.playAudioAdvanced('callId', {
		fileUrl: 'https://s3.amazonaws.com/bwdemos/media/ring.mp3',
		loopEnabled: true
	})).thenResolve();
	td.when(t.context.bandwidthApi.Application.get('applicationId')).thenResolve({
		incomingCallUrl: 'incomingCallUrl'
	});
	td.when(t.context.bandwidthApi.Call.create({
		from: '0000',
		to: '+12345678900',
		callbackUrl: 'incomingCallUrl',
		sipHeaders: {'X-Tracking-Id': 'trackingId1'},
		transcriptionEnabled: true,
		recordingEnabled: true
	})).thenResolve({id: 'anotherCallId'});
	td.when(t.context.bandwidthApi.Bridge.create({
		bridgeAudio: true,
		callIds: ['anotherCallId', 'callId']
	})).thenResolve();
	await callCallback({
		callId: 'callId',
		eventType: 'answer',
		from: 'sip:test@test.com',
		to: '+12345678900'
	}, t.context);
	t.pass();
});

test('should handle answer event (another leg)', async t => {
	td.when(t.context.bandwidthApi.Call.get('callId11')).thenResolve({
		sipHeaders: {'X-Tracking-Id': 'trackingId11'}
	});
	const tracking = {
		user: {
			sipUri: 'sip:test@test.com',
			servicePhoneNumber: '0000'
		},
		button: {
			number: '+12345678900',
			enabled: true,
			deleted: false
		},
		answeredAt: null,
		callIds: ['callId11', 'anotherCallId11'],
		save: () => Promise.resolve()
	};
	td.when(CallTracking.findById('trackingId11')).thenReturn(wrapPromise(tracking));
	td.when(t.context.bandwidthApi.Call.playAudioAdvanced('anotherCallId11', {fileUrl: ''})).thenResolve();
	await callCallback({
		callId: 'callId11',
		eventType: 'answer',
		from: '0000',
		to: '+12345678900'
	}, t.context);
	t.truthy(tracking.answeredAt);
});

test('should handle answer event (for deleted button)', async t => {
	td.when(t.context.bandwidthApi.Call.get('callId2')).thenResolve({
		sipHeaders: {'X-Tracking-Id': 'trackingId2'}
	});
	td.when(CallTracking.findById('trackingId2')).thenReturn(wrapPromise({
		user: {
			sipUri: 'sip:test@test.com',
			servicePhoneNumber: '0000'
		},
		button: {
			number: '+12345678900',
			enabled: true,
			deleted: true
		},
		save: () => Promise.resolve()
	}));
	await callCallback({
		callId: 'callId2',
		eventType: 'answer',
		from: 'sip:test@test.com',
		to: '+12345678900'
	}, t.context);
	t.pass();
});

test('should handle answer event (for invalid "from")', async t => {
	td.when(t.context.bandwidthApi.Call.get('callId3')).thenResolve({
		sipHeaders: {'X-Tracking-Id': 'trackingId3'}
	});
	td.when(CallTracking.findById('trackingId3')).thenReturn(wrapPromise({
		user: {
			sipUri: 'sip:test@test.com',
			servicePhoneNumber: '0000'
		},
		button: {
			number: '+12345678900',
			enabled: true,
			deleted: false
		},
		save: () => Promise.resolve()
	}));
	await callCallback({
		callId: 'callId3',
		eventType: 'answer',
		from: 'sip:test1@test.com',
		to: '+12345678900'
	}, t.context);
	t.pass();
});

test('should handle recording event', async t => {
	td.when(t.context.bandwidthApi.Call.get('callId4')).thenResolve({
		sipHeaders: {'X-Tracking-Id': 'trackingId4'}
	});
	const tracking = {
		user: {
			sipUri: 'sip:test@test.com',
			servicePhoneNumber: '0000'
		},
		button: {
			number: '+12345678900',
			enabled: true,
			deleted: false
		},
		save: () => Promise.resolve()
	};
	td.when(CallTracking.findById('trackingId4')).thenReturn(wrapPromise(tracking));
	td.when(t.context.bandwidthApi.Recording.get('recordingId4')).thenResolve({
		media: 'http://localhost/recording.mp3'
	});
	await callCallback({
		callId: 'callId4',
		eventType: 'recording',
		status: 'complete',
		recordingId: 'recordingId4'
	}, t.context);
	t.is(tracking.mediaName, 'recording.mp3');
});

test('should handle transcription event', async t => {
	td.when(t.context.bandwidthApi.Call.get('callId5')).thenResolve({
		sipHeaders: {'X-Tracking-Id': 'trackingId5'}
	});
	const tracking = {
		user: {
			sipUri: 'sip:test@test.com',
			servicePhoneNumber: '0000'
		},
		button: {
			number: '+12345678900',
			enabled: true,
			deleted: false
		},
		save: () => Promise.resolve()
	};
	td.when(CallTracking.findById('trackingId5')).thenReturn(wrapPromise(tracking));
	td.when(t.context.bandwidthApi.Recording.getTranscription('recordingId5', 'transcriptionId5')).thenResolve({
		text: 'text'
	});
	await callCallback({
		callId: 'callId5',
		eventType: 'transcription',
		status: 'completed',
		recordingId: 'recordingId5',
		transcriptionId: 'transcriptionId5'
	}, t.context);
	t.is(tracking.transcribedText, 'text');
});

test('should handle hangup event', async t => {
	td.when(t.context.bandwidthApi.Call.get('callId6')).thenResolve({
		sipHeaders: {'X-Tracking-Id': 'trackingId6'}
	});
	const tracking = {
		user: {
			sipUri: 'sip:test@test.com',
			servicePhoneNumber: '0000'
		},
		button: {
			number: '+12345678900',
			enabled: true,
			deleted: false
		},
		answeredAt: new Date(Date.now() - 30000).toISOString(),
		callIds: ['callId6', 'anotherCallId6'],
		save: () => Promise.resolve()
	};
	td.when(CallTracking.findById('trackingId6')).thenReturn(wrapPromise(tracking));
	td.when(t.context.bandwidthApi.Recording.getTranscription('recordingId5', 'transcriptionId5')).thenResolve({
		text: 'text'
	});
	td.when(t.context.bandwidthApi.Call.hangup('anotherCallId6')).thenResolve();
	await callCallback({
		callId: 'callId6',
		eventType: 'hangup'
	}, t.context);
	t.is(tracking.duration, 30);
	t.true(tracking.completed);
});
