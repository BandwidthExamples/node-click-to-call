import React from 'react'
import {Form, FormBox, TextField, FlexFields, SubmitButtonField, Alert} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {createResetPasswordRequest, SET_EMAIL} from '../store/resetPasswordRequest'

class ResetPassword extends React.Component {
	render() {
		const {email, setEmail, createResetPasswordRequest, error, success, loading} = this.props
		return (
			<FormBox>
				<Form onSubmit={createResetPasswordRequest}>
					{error && <Alert type="error">{error}</Alert>}
					{success && <Alert type="success">Request to reset password has been created. Please check your email and follow instructions there.</Alert>}
					<FlexFields>
						<TextField
							label="Your Email"
							name="email"
							type="email"
							input={{
								value: email,
								onChange: ev => setEmail(ev.target.value)
							}}
							required
						/>
					</FlexFields>
					<SubmitButtonField loading={loading}>Create request</SubmitButtonField>
				</Form>
			</FormBox>
		)
	}
}

export default connect(
	state => ({
		initialValues: state.resetPasswordRequest,
		error: state.resetPasswordRequest.error,
		success: state.resetPasswordRequest.success,
		loading: state.resetPasswordRequest.loading
	}),
	dispatch => ({
		setEmail: email => dispatch({type: SET_EMAIL, email}),
		createResetPasswordRequest: ev => {
			ev.preventDefault()
			return dispatch(createResetPasswordRequest())
		}
	})
)(ResetPassword)
