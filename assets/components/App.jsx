import React from 'react'
import createHistory from 'history/createBrowserHistory'
import {ConnectedRouter} from 'react-router-redux'

const history = createHistory()

export default class App extends React.Component {
	render() {
		console.log(history)
		return (
			<ConnectedRouter history={history}>
				<h1>Router</h1>
			</ConnectedRouter>
		)
	}
}

