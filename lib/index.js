const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const koaSession = require('koa-session');
const passport = require('koa-passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.load();

const router = require('./routes');
const {User} = require('./models');

async function main() {
	mongoose.Promise = global.Promise;
	await mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost/click-to-call');
	passport
		.use(new LocalStrategy({usernameField: 'email'}, (userName, password, done) => User.checkUser(userName, password).then(user => done(null, user), done)));
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});
	passport.deserializeUser((userId, done) => {
		User.findById(userId).then(user => {
			done(null, user);
		}, done);
	});

	const app = new Koa();
	app.keys = (process.env.COOKIES_KEYS || '8ZnrWgB8XjOdzrApG9e7ZPINj3OlIWEY').split(';');
	app.proxy = true;
	app
		.use(host)
		.use(koaBody({multipart: true}))
		.use(koaSession(app))
		.use(passport.initialize())
		.use(passport.session())
		.use(router.routes())
		.use(router.allowedMethods())
		.use(koaStatic(path.join(__dirname, '..', 'public')));
	return app;
}

module.exports = main;
