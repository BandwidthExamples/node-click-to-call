(function(factory){
		if (typeof module === 'object' && typeof module.exports === 'object'){
			// Common JS support
			module.exports = 	factory(true)
		} else {
			factory()
		}
} )(function(noGlobal) {
	const loadJS = url => {
		return new Promise((resolve, reject) => {
			const scriptTag = document.createElement('script')
			scriptTag.src = url

			scriptTag.onload = resolve
			scriptTag.onreadystatechange = resolve

			document.body.appendChild(scriptTag)
		})
	};
	const getDetectRTC = () => typeof window.DetectRTC === 'function' ? Promise.resolve(window.fetch) : loadJS('https://unpkg.com/detectrtc@1.3.5').then(() => new Promise(resolve => {
		window.DetectRTC.load(resolve)
	}))
	const getFetch = () => typeof window.fetch === 'function' ? Promise.resolve(window.fetch) : loadJS('https://unpkg.com/whatwg-fetch')
	const getJSSip = () => typeof window.JsSIP !== 'undefined' ? Promise.resolve(window.JsSIP) : loadJS('https://unpkg.com/jssip@3.0.13/dist/jssip.min.js')
	const prepare = el => {
		getFetch()
			.then(() => getDetectRTC())
			.then(() => getJSSip())
			.then(() => {
				const DetectRTC = window.DetectRTC
				const fetch = window.fetch
				const JsSIP = window.JsSIP
				if (DetectRTC.isWebRTCSupported === false) {
					return alert('This browser does not support WebRTC. Please use latest Chrome (or Chromium-based browser) or Firefox.');
				}
				if (DetectRTC.isWebSocketsSupported === false) {
					return alert('This browser does not support Websockets. Please use latest Chrome (or Chromium-based browser) or Firefox.');
				}
				el.addEventListener('click', ev => {
					ev.preventDefault()
				}, false)
			})
	}
	const result = noGlobal ? {} : window
	result.prepare = prepare
	return result
})
