import React from 'react';
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'

import createStore from './store/createStore'

const store = createStore(window.__INITIAL_STATE__)

// Render Setup
// ------------------------------------
const MOUNT_NODE = document.getElementById('app')

let render = () => {
	debugger
	const App = require('./components/App.jsx').default

	ReactDOM.render(
		<Provider store={store}>
			<App history={history}>
			</App>
		</Provider>,
		MOUNT_NODE
	)
}

// Development Tools
// ------------------------------------
if (ENV !== 'production') {
	if (module.hot) {
		const renderApp = render
		const renderError = (error) => {
			const RedBox = require('redbox-react').default
			ReactDOM.render(<RedBox error={error} />, MOUNT_NODE)
		}

		render = () => {
			try {
				renderApp()
			} catch (e) {
				console.error(e)
				renderError(e)
			}
		}

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
