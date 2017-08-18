import React from 'react'
import createHistory from 'history/createBrowserHistory'
import {ConnectedRouter} from 'react-router-redux'
import {BandwidthThemeProvider, Navigation} from '@bandwidth/shared-components'

const history = createHistory()

export default class App extends React.Component {
	render() {
		return (
			<BandwidthThemeProvider>
				<ConnectedRouter history={history}>
				</ConnectedRouter>
			</BandwidthThemeProvider>
		)
	}
}

