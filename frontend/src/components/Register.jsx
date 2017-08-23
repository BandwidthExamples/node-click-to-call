import React from 'react'
import {Form, FormBox, TextField, FlexFields, SubmitButtonField, Alert, AnchorField} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {register, SET_EMAIL, SET_PASSWORD, SET_REPEAT_PASSWORD} from '../store/register'

class Register extends React.Component {
	render() {
		const {email, password, repeatPassword, setEmail, setPassword, setRepeatPassword, register, error, success} = this.props
		return (
			<FormBox>
				<Form onSubmit={register}>
					{error && <Alert type="error">{error}</Alert>}
					{success && <Alert type="success">User has been created. Please check your email and follow instructions there.</Alert>}
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
					<FlexFields>
						<TextField
							label="Repeat Password"
							name="repeatPassword"
							type="password"
							input={{
								value: repeatPassword,
								onChange: ev => setRepeatPassword(ev.target.value)
							}}
							required
						/>
					</FlexFields>
					<SubmitButtonField>Register</SubmitButtonField>
				</Form>
				<AnchorField to="/login">Login with existing user</AnchorField>
			</FormBox>
		)
	}
}

export default connect(
	state => ({
		initialValues: state.register,
		error: state.register.error,
		success: state.register.success
	}),
	dispatch => ({
		setEmail: email => dispatch({type: SET_EMAIL, email}),
		setPassword: password => dispatch({type: SET_PASSWORD, password}),
		setRepeatPassword: password => dispatch({type: SET_REPEAT_PASSWORD, password}),
		register: ev => {
			ev.preventDefault()
			return dispatch(register())
		}
	})
)(Register)
