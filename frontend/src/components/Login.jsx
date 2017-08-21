import React from 'react'
import {Form, FormBox, TextField, FlexFields, SubmitButtonField} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {login, SET_EMAIL, SET_PASSWORD} from '../store/login'

class Login extends React.Component {
	render() {
		const {email, password, setEmail, setPassword, login} = this.props
		return (
			<FormBox>
				<Form onSubmit={login}>
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
    initialValues: state.login
	}),
	dispatch => ({
		setEmail: email => dispatch({type: SET_EMAIL, email}),
		setPassword: password => dispatch({type: SET_PASSWORD, password}),
		login: ev => {
			ev.preventDefault()
			return login()
		}
	})
)(Login)
