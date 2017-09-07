(function(factory){
	if (typeof module === 'object' && typeof module.exports === 'object'){
		// Common JS support
		module.exports = 	factory(true)
	} else {
		factory()
	}
} )(function(noGlobal) {
var thisScriptUrl = document.currentScript.src;
var loadJS = function(url) {
	return new Promise(function(resolve, reject) {
		var scriptTag = document.createElement('script')
		scriptTag.src = url

		scriptTag.onload = resolve
		scriptTag.onreadystatechange = resolve

		document.body.appendChild(scriptTag)
	})
};
var getDetectRTC = function(){
	return typeof window.DetectRTC === 'function' ? Promise.resolve(window.fetch) : loadJS('https://unpkg.com/detectrtc@1.3.5').then(function() {
		return new Promise(function(resolve) {
			window.DetectRTC.load(resolve)
		})
	})
}
var getFetch = function() { return typeof window.fetch === 'function' ? Promise.resolve(window.fetch) : loadJS('https://unpkg.com/whatwg-fetch') }
var getJSSip = function() { return typeof window.JsSIP !== 'undefined' ? Promise.resolve(window.JsSIP) : loadJS('https://unpkg.com/jssip@3.0.13/dist/jssip.min.js') }
var remoteAudio = new window.Audio();
remoteAudio.autoplay = true;
document.body.appendChild(remoteAudio);
var prepare = function(el, options) {
	options = options || {};
	getFetch()
		.then(getDetectRTC)
		.then(getJSSip)
		.then(function() {
			var DetectRTC = window.DetectRTC
			var fetch = window.fetch
			var JsSIP = window.JsSIP
			if (DetectRTC.isWebRTCSupported === false) {
				return console.error('This browser does not support WebRTC. Please use latest Chrome (or Chromium-based browser) or Firefox.');
			}
			if (DetectRTC.isWebSocketsSupported === false) {
				return console.error('This browser does not support Websockets. Please use latest Chrome (or Chromium-based browser) or Firefox.');
			}
			el.addEventListener('click', function(ev) {
				ev.preventDefault()
				options.id = options.id || ev.target.dataset.id
				options.className = options.className || ev.target.dataset.callProgressClassName
				var url = thisScriptUrl.replace('/click.js', '/buttons/' + options.id + '/click')
				fetch(url, {method: 'POST', mode: 'cors'})
					.then(function(r) {
						if (!r.ok) {
							return r.text().then(text => {
								throw new Error(text)
							})
						}
						return r.json()
					})
					.then(makeCall, options)
			}, false)
		})
}
var makeCall = function (data, options) {
	var id = data.id
	var authToken = data.token
	var sipUri = data.sipUri
	var number = data.number
	if (!options) {
		options = {}
	}
	var socket = new JsSIP.WebSocketInterface('wss://webrtc.registration.bandwidth.com:10443')

	var authHeader = 'X-Callsign-Token: ' + authToken
	var buttonHeader = 'X-TRACKING-ID: ' + id

	var callOptions = {
		extraHeaders: [authHeader, buttonHeader],
		mediaConstraints: {
			audio: true,
			video: false
		},
		pcConfig: {rtcpMuxPolicy: 'negotiate'} // to avoid a connection issue with Chrome 57+
	}

	var bwPhone = new JsSIP.UA({
		uri: sipUri,
		sockets: [socket],
		register: false
	})

	bwPhone.registrator().setExtraHeaders([authHeader, buttonHeader])
	bwPhone.start()
	bwPhone.on('connected', function(){
		bwPhone.register()
	})

	bwPhone.on('registered', function(){
		bwPhone.call(number, callOptions)
	})

	bwPhone.on("newRTCSession", function(data){
		var session = data.session;
		session.on('peerconnection', function(data) {
			data.peerconnection.addEventListener('addstream', function(e){
				remoteAudio.src = window.URL.createObjectURL(e.stream)
			})
		})
		var callProgress = null
		session.on('progress', function(){
			if (typeof options.showCallProgress === 'function') {
				options.showCallProgress({
					number,
					hangup: function(){
						session.terminate()
					}
				})
			} else {
				callProgress = document.createElement('div')
				callProgress.style = 'z-index: 999; position: position: absolute; margin: auto; width: 50%; padding: 20px; display: flex; flex-direction: column; align-items: center; background-color: white;'
				callProgress.innerHTML = '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">' +
				'<style>\n' +
				'.c2c-phone-number {\n\tfont-weight: bold;\n}\n\n' +
				'.c2c-connect-call {\n\tcolor: #FFF;\n\tbackground-color: red;\n\twidth: 50px;\n\theight: 50px;\n\ttext-align: center;\n\tfont-size: 30px;\n\tmargin: 10px 0px 10px 0px;\n\tborder-radius: 25px 25px 25px 25px;\n\tmargin-top: 30px;\n\tcursor: pointer;\n\tcursor: hand;}\n' +
				'</style>\n' +
				'<div class="c2c-phone-number">' + number + '</div><div class="c2c-connect-call"><i class="fa fa-phone" style="margin-top: 8px;"></i></div>'
				callProgress.className = options.className
				document.body.appendChild(callProgress)
				var hangupButton = callProgress.getElementsByClassName('c2c-connect-call')[0]
				hangupButton.addEventListener('click', function(ev) {
					ev.preventDefault()
					ev.stopPropagation()
					session.terminate()
				})
			}
		})
		var finish = function () {
			bwPhone.unregister({all: true})
			if (typeof options.hideCallProgress === 'function') {
				options.hideCallProgress()
			} else {
				if (callProgress) {
					document.body.removeChild(callProgress)
					callProgress = null
				}
			}
		};
		session.on('ended', finish)
		session.on('failed', finish)
	})
}
var result = noGlobal ? {} : window
result.prepare = prepare
if (!noGlobal) {
	document.addEventListener('DOMContentLoaded', function() {
		document.querySelectorAll('.click-to-call').forEach(function(el) {
			return prepare(el)
		})
	})
}
return result
})
