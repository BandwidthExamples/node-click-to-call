node-click-to-call
======================

Sip App is simple application which allows to make calls directly to sip account, redirect outgoing calls from sip account to another number, redirect incoming calls from specific number to sip account. Also this application demonstrate how to receive/create an application, domain, endpoint, buy phone numbers.


Before run them fill config file `options.json` with right values.
Option `domain` should contains host name (and port) which will be used to access to the server from external network.


### How to run

Install required node modules

```
npm install
```

Run sipApp demo as

```
node sipApp.js
```


Use environment variable `PORT` to change default port (3000) which will be used by these apps.

Open home page in browser first (http://domain)  and follow instructions on it

### Deploy on heroku

Create account on [Heroku](https://www.heroku.com/) and install [Heroku Toolbel](https://devcenter.heroku.com/articles/getting-started-with-ruby#set-up) if need.

Open `package.json` in text editor and select which demo you would like to deploy on line 7.

```

// for Sip App
"start": "node ./sipApp.js"

```

Then open `options.json` and fill it with valid values (except `domain`).

Commit your changes.

```
git add .
git commit -a -m "Deployment"
```

Run `heroku create` to create new app on Heroku and link it with current project.

Change option `domain` in options.json by assigned by Heroku value (something like XXXX-XXXXXX-XXXX.heroku.com). Commit your changes by `git commit -a`. 

Run `git push heroku master` to deploy this project.

Run `heroku open` to see home page of the app in the browser

### Open external access via ngrock

As alternative to deployment to external hosting you can open external access to local web server via [ngrock](https://ngrok.com/).

First instal ngrock on your computer. Run ngrock by


```
ngrok http 3000 #you can use another free port if need 
```

You will see url like http://XXXXXXX.ngrok.io on console output. Open `options.json` and fill value `domain` by value from console (i.e. like XXXXXXX.ngrock.io). Save changes and run demo app by


```
# for Sip App
PORT=3000 node ./sip_app.js
```

