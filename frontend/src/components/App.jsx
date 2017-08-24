import React from 'react'
import {Route} from 'react-router'
import {ConnectedRouter} from 'react-router-redux'
import {BandwidthThemeProvider, Navigation, Page, Spacing} from '@bandwidth/shared-components'

import Register from './Register.jsx'
import ResetPasswordRequest from './ResetPasswordRequest.jsx'
import ResetPassword from './ResetPassword.jsx'
import Login from './Login.jsx'
import Home from './Home.jsx'
import {history} from '../store/createStore'
import {getProfile} from '../store/profile'
import {logout} from '../store/login'
import {connect} from 'react-redux'

class App extends React.Component {
	componentWillMount() {
		this.props.getProfile()
	}

	render() {
		const links = []
		if (this.props.profile.id) {
			links.push({to: '/profile', exact: true, content: 'Profile'})
			links.push({to: '#', content: 'Logout', onClick: ev => {
				this.props.logout().then(() => this.props.getProfile()).then(() => history.push('/login'))
				ev.preventDefault()
			}})
		} else {
			links.push({to: '/login', exact: true, content: 'Login'})
		}
		return (
			<BandwidthThemeProvider>
				<ConnectedRouter history={history}>
					<div>
						<Navigation
								title="Click to call"
								links={links}
							/>
						<Page>
							<Spacing>
								<Route exact path="/" component={Home}/>
								<Route exact path="/login" component={Login}/>
								<Route exact path="/logout" component={Login}/>
								<Route exact path="/register" component={Register}/>
								<Route exact path="/reset-password-request" component={ResetPasswordRequest}/>
								<Route exact path="/reset-password/:token" component={ResetPassword}/>
							</Spacing>
						</Page>
					</div>
				</ConnectedRouter>
			</BandwidthThemeProvider>
		)
	}
}

export default connect(
	state => ({
		profile: state.profile
	}),
	dispatch => ({
		getProfile: password => dispatch(getProfile()),
		logout: () => dispatch(logout())
	})
)(App)
