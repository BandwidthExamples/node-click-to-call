import React from 'react';
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'

import createStore from './store/createStore'
import {UPDATE_CALL} from './store/calls'

const store = createStore(window.__INITIAL_STATE__)

// Render Setup
// ------------------------------------
const MOUNT_NODE = document.getElementById('app')

let render = () => {
	const App = require('./components/App.jsx').default

	ReactDOM.render(
		(<Provider store={store}>
			<App>
			</App>
		</Provider>),
		MOUNT_NODE
	)
}

const source = new EventSource('/buttons/sse');
source.onmessage = event => {
	const state = store.getState()
	const call = JSON.parse(event.data)
	if (call.button === state.calls.buttonId) {
		store.dispatch({type: UPDATE_CALL, call})
	}
}

// Development Tools
// ------------------------------------
if (process.env.NODE_ENV !== 'production') {
	if (module.hot) {

		// Setup hot module replacement
		module.hot.accept([
			'./components/App.jsx'
		], () =>
			setImmediate(() => {
				ReactDOM.unmountComponentAtNode(MOUNT_NODE)
				render()
			})
		)
	}
}

render()
