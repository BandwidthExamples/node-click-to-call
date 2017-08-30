(function(factory){
		if (typeof module === 'object' && typeof module.exports === 'object'){
			// Common JS support
			module.exports = 	factory(true)
		} else {
			factory()
		}
} )(function(noGlobal) {
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
	var prepare = function(el) {
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
					var id = ev.target.dataset.id
					fetch('/buttons/' + id + '/click', {method: 'POST', mode: 'cors'})
						.then(function(r) {
							if (r.error) {
								throw new Error(r.error)
							}
							return r.json()
						})
						.then(makeCall)
				}, false)
			})
	}
	var makeCall = function (data) {
		var id = data.id
		var authToken = data.token
		var sipUri = data.sipUri
		var number = data.number
		var socket = new JsSIP.WebSocketInterface('wss://webrtc.registration.bandwidth.com:10443')

		var authHeader = 'X-Callsign-Token: ' + authToken
		var buttonHeader = 'X-Button-Id: ' + id

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

		var finish = function () {
			bwPhone.unregister({all: true})
		};

		bwPhone.on('registered', function(){
			bwPhone.call(number, callOptions)
		})

		bwPhone.on("newRTCSession", function(data){
			var session = data.session;
			session.on('ended', finish)
			session.on('failed', finish)
		})
	}
	var result = noGlobal ? {} : window
	result.prepare = prepare
	if (!noGlobal) {
		document.addEventListener('DOMContentLoaded', function() {
			 document.querySelectorAll('.click-to-call').forEach(prepare)
		})
	}
	return result
})
