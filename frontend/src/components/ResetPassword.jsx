import React from 'react'
import {Form, FormBox, TextField, FlexFields, SubmitButtonField, Alert} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {resetPassword, SET_PASSWORD, SET_REPEAT_PASSWORD} from '../store/resetPassword'

class ResetPassword extends React.Component {
	render() {
		const {setPassword, setRepeatPassword, password, repeatPassword, resetPassword, error} = this.props
		return (
			<FormBox>
				<Form onSubmit={ev => resetPassword(ev, this.props.match.params.token)}>
					{error && <Alert type="error">{error}</Alert>}
					<FlexFields>
						<TextField
							label="New Password"
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
					<SubmitButtonField>Set password</SubmitButtonField>
				</Form>
			</FormBox>
		)
	}
}

export default connect(
	state => ({
		initialValues: state.resetPassword,
		error: state.resetPassword.error
	}),
	dispatch => ({
		setPassword: password => dispatch({type: SET_PASSWORD, password}),
		setRepeatPassword: password => dispatch({type: SET_REPEAT_PASSWORD, password}),
		resetPassword: (ev, token) => {
			ev.preventDefault()
			return dispatch(resetPassword(token))
		}
	})
)(ResetPassword)
