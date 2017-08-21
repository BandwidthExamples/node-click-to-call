import React from 'react'
import createHistory from 'history/createBrowserHistory'
import {Route} from 'react-router'
import {ConnectedRouter} from 'react-router-redux'
import {BandwidthThemeProvider, Navigation, Page, Spacing} from '@bandwidth/shared-components'

import Register from './Register.jsx'
import ResetPassword from './ResetPassword.jsx'
import Login from './Login.jsx'
import Home from './Home.jsx'

const history = createHistory()

export default class App extends React.Component {
	render() {
		return (
			<BandwidthThemeProvider>
				<ConnectedRouter history={history}>
					<div>
						<Navigation
								title="Click to call"
								links={[
									{to: '/login', exact: true, content: 'Login'},
								]}
							/>
						<Page>
							<Spacing>
								<Route exact path="/" component={Home}/>
								<Route exact path="/login" component={Login}/>
								<Route exact path="/register" component={Register}/>
								<Route exact path="/reset-password" component={ResetPassword}/>
							</Spacing>
						</Page>
					</div>
				</ConnectedRouter>
			</BandwidthThemeProvider>
		)
	}
}

