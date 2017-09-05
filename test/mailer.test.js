const test = require('ava');
const td = require('testdouble');
const nodemailer = require('nodemailer');

td.replace(nodemailer, 'createTransport');

const fakeTransport = {
	sendMail: td.function()
};
td.when(nodemailer.createTransport(td.matchers.anything(), td.matchers.anything())).thenReturn(fakeTransport);

const mailer = require('../lib/mailer');

test('should send email message', async t => {
	td.when(fakeTransport.sendMail({subject: 'subject', text: 'text', to: 'to'})).thenResolve();
	await mailer('to', {subject: 'subject', text: 'text'});
	t.pass();
});
