const {createTransport} = require('nodemailer');

const transporter = createTransport({
	host: process.env.SMTP_HOST || 'smtp.gmail.com',
	port: Number(process.env.SMTP_PORT || 465),
	secure: process.env.SMTP_SECURE !== 'false',
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD
	}
}, {from: process.env.FROM_EMAIL || process.env.SMTP_USER});

module.exports = (to, data) => {
	const message = Object.assign({to}, data);
	return transporter.sendMail(message);
};
