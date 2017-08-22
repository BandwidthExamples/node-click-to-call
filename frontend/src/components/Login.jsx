import React from 'react'
import {Form, FormBox, TextField, FlexFields, SubmitButtonField, Alert} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {login, SET_EMAIL, SET_PASSWORD} from '../store/login'

class Login extends React.Component {
	render() {
		const {email, password, setEmail, setPassword, login, error} = this.props
		return (
			<FormBox>
				<Form onSubmit={login}>
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
					<SubmitButtonField>
						Login
					</SubmitButtonField>
				</Form>
			</FormBox>
		)
	}
}

export default connect(
	state => ({
		initialValues: state.login,
		error: state.login.error
	}),
	dispatch => ({
		setEmail: email => dispatch({type: SET_EMAIL, email}),
		setPassword: password => dispatch({type: SET_PASSWORD, password}),
		login: ev => {
			ev.preventDefault()
			return dispatch(login())
		}
	})
)(Login)
