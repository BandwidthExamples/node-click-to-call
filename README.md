## Bandwidth Click-to-call Example

[![Build Status](https://travis-ci.org/BandwidthExamples/node-click-to-call.svg)](https://travis-ci.org/BandwidthExamples/node-click-to-call)

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

Demo app to generate Clic-to-call buttons

## Prerequisites
- Configured Machine with Ngrok/Port Forwarding
  - [Ngrok](https://ngrok.com/)
- [Bandwidth Account](https://catapult.inetwork.com/pages/signup.jsf/?utm_medium=social&utm_source=github&utm_campaign=dtolb&utm_content=_)
- [Node v8.0+](https://nodejs.org/en/)
- [MongoDb](http://www.mongodb.org/)
- [Redis](https://redis.io)
- [Git](https://git-scm.com/)


## Build and Deploy

### One Click Deploy

#### Settings Required To Run
* ```Bandwidth User Id```
* ```Bandwidth Api Token```
* ```Bandwidth Api Secret```
* ```SMTP Host Name"```
* ```SMTP Port```
* ```SMTP Secure Port```
* ```SMTP User Name```
* ```SMTP Password```


[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Run

### Directly

```bash
# Check first if mongodb and redis are started and available
# Use DATABASE_URL to specify location of db if need
# User REDIS_URL to to specify location of redis if need

export BANDWIDTH_USER_ID=<YOUR-USER-ID>
export BANDWIDTH_API_TOKEN=<YOUR-API-TOKEN>
export BANDWIDTH_API_SECRET=<YOUR-API-SECRET>
export SMTP_HOST=<YOUR-SMTP-HOST>
export SMTP_PORT=<YOUR-SMTP-PORT>
export SMTP_USER=<YOUR-SMTP-USER>
export SMTP_PASSWORD=<YOUR-SMTP-PASSWORD>


npm install # to install dependencies
npm run build # to build frontend

npm start
```

### Via Docker

```bash
# fill .env file with auth data first

# run the app (it will listen port 8080)
PORT=8080 docker-compose up -d
```
