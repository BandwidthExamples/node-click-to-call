import React from 'react'
import {Route, Redirect} from 'react-router'
import {ConnectedRouter} from 'react-router-redux'
import {BandwidthThemeProvider, Navigation, Page, Spacing} from '@bandwidth/shared-components'

import Register from './Register.jsx'
import ResetPasswordRequest from './ResetPasswordRequest.jsx'
import ResetPassword from './ResetPassword.jsx'
import Login from './Login.jsx'
import Profile from './Profile.jsx'
import Buttons from './Buttons.jsx'
import Calls from './Calls.jsx'

import {history} from '../store/createStore'
import {getProfile} from '../store/profile'
import {logout} from '../store/login'
import {connect} from 'react-redux'

class App extends React.Component {
	componentWillMount() {
		this.props.getProfile()
	}

	render() {
		if (!this.props.profile.loaded) {
			return (null)
		}
		const links = []
		const isLoggedIn = this.props.profile.id
		if (isLoggedIn) {
			links.push({to: '/my-profile', exact: true, content: 'Profile'})
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
								<Route exact path="/login" component={Login}/>
								<Route exact path="/logout" component={Login}/>
								<Route exact path="/register" component={Register}/>
								<Route exact path="/my-profile" component={Profile}/>
								<Route exact path="/reset-password-request" component={ResetPasswordRequest}/>
								<Route exact path="/reset-password/:token" component={ResetPassword}/>
								<Route path="/click-to-call-buttons" component={Buttons}/>
								<Route path="/calls/:id" component={Calls}/>
								{ (isLoggedIn) ?
									(<Redirect from="/" to="/click-to-call-buttons"/>) :
									(<Redirect from="/" to="/login"/>)
								}
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
