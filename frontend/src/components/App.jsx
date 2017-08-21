import React from 'react'
import createHistory from 'history/createBrowserHistory'
import {Route} from 'react-router'
import {ConnectedRouter} from 'react-router-redux'
import {BandwidthThemeProvider, Navigation, Page, Spacing, Form} from '@bandwidth/shared-components'

const history = createHistory()

class Home extends React.Component {
	render() {
		return (
			<p>Home</p>
		)
	}
}

class Test extends React.Component {
	render() {
		return (
			<p>Test</p>
		)
	}
}


export default class App extends React.Component {
	render() {
		return (
			<BandwidthThemeProvider>
				<ConnectedRouter history={history}>
					<div>
						<Navigation
								title="Click to call"
								links={[
									{to: '/', exact: true, content: 'Home'},
									{to: '/test', exact: true, content: 'Test'},
								]}
							/>
						<Page>
							<Route exact path="/" component={Home}/>
							<Route exact path="/test" component={Test}/>
						</Page>
					</div>
				</ConnectedRouter>
			</BandwidthThemeProvider>
		)
	}
}

