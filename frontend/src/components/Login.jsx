import React from 'react'
import {Form, FormBox, TextField, FlexFields, SubmitButtonField, Alert, AnchorField} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {login, SET_EMAIL, SET_PASSWORD} from '../store/login'
import {getProfile} from '../store/profile'


class Login extends React.Component {
	render() {
		const {email, password, setEmail, setPassword, login, error, loading, history} = this.props
		return (
			<FormBox>
				<Form onSubmit={ev => login(ev).then(() => history.push('/'))}>
					{error && <Alert type="error">{error}</Alert>}
					<FlexFields>
						<TextField
							label="Email"
							name="email"
							type="email"
							input={{
								value: email,
								onChange: ev => setEmail(ev.target.value)
							}}
							required
						/>
					</FlexFields>
					<FlexFields>
						<TextField
							label="Password"
							name="password"
							type="password"
							input={{
								value: password,
								onChange: ev => setPassword(ev.target.value)
							}}
							required
						/>
					</FlexFields>
					<SubmitButtonField loading={loading}>Login</SubmitButtonField>
				</Form>
				<div>
					<AnchorField to="/register">Register new user</AnchorField>
					<AnchorField to="/reset-password-request">Forgot your password</AnchorField>
				</div>
			</FormBox>
		)
	}
}

export default connect(
	state => ({
		email: state.login.email,
		password: state.login.password,
		error: state.login.error,
		loading: state.login.loading
	}),
	dispatch => ({
		setEmail: email => dispatch({type: SET_EMAIL, email}),
		setPassword: password => dispatch({type: SET_PASSWORD, password}),
		login: ev => {
			ev.preventDefault()
			return dispatch(login()).then(() => dispatch(getProfile()))
		}
	})
)(Login)
