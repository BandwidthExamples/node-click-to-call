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
	var remoteAudio = new window.Audio();
	remoteAudio.autoplay = true;
	var prepare = function(el, options={}) {
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
					var url = document.currentScript.src.replace('/click.js', '/buttons/' + id + '/click')
					fetch(url, {method: 'POST', mode: 'cors'})
						.then(function(r) {
							if (r.error) {
								throw new Error(r.error)
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
							session.terminate({extraHeaders: [authHeader, buttonHeader]})
						}
					})
				} else {
					callProgress = document.createElement('div')
					callProgress.style = 'z-index: 999; position: position: absolute; margin: auto; width: 50%; padding: 50px; left: 0; top: 50px;'
					callProgress.innerHTML = '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">' +
					'<style>' +
					'.c2c-phone-number{text-align: center; font-weight: bold;}' +
					'.c2c-connect-call{color: #FFF; background-color: #389400; width: 50px; height: 50px; text-align: center; font-size: 30px; margin: 10px 0px 10px 0px; border-radius: 25px 25px 25px 25px; -moz-border-radius: 25px 25px 25px 25px; -webkit-border-radius: 25px 25px 25px 25px; cursor: pointer; cursor: hand;}' +
					'</style>' +
					'<div class"c2c-phone-number">' + number + '</div><div class"c2c-connect-call"><i class="fa fa-phone"></i></div>'
					var hangupButton = callProgress.getElementsByClassName('c2c-connect-call')[0]
					hangupButton.addEventListener('click', function(ev) {
						ev.preventDefault()
						session.terminate({extraHeaders: [authHeader, buttonHeader]})
					})
					document.body.appendChild(callProgress)
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
			 document.querySelectorAll('.click-to-call').forEach(prepare)
		})
	}
	return result
})
