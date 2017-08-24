import React from 'react'
import {Form, FormBox, TextField, FlexFields, SubmitButtonField, Alert} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {saveProfile, SET_OLD_PASSWORD, SET_PASSWORD, SET_REPEAT_PASSWORD} from '../store/profile'

class ResetPassword extends React.Component {
	render() {
		const {setOldPassword, setPassword, setRepeatPassword, password, repeatPassword, oldPassword, saveProfile, error, success, loading} = this.props
		return (
			<FormBox>
				<Form onSubmit={saveProfile}>
					{error && <Alert type="error">{error}</Alert>}
					{success && <Alert type="success">Saved</Alert>}
					<FlexFields>
						<TextField
							label="Old Password"
							name="oldPassword"
							type="password"
							input={{
								value: oldPassword,
								onChange: ev => setOldPassword(ev.target.value)
							}}
							required
						/>
					</FlexFields>
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
							label="Repeat New Password"
							name="repeatPassword"
							type="password"
							input={{
								value: repeatPassword,
								onChange: ev => setRepeatPassword(ev.target.value)
							}}
							required
						/>
					</FlexFields>
					<SubmitButtonField loading={loading}>Save</SubmitButtonField>
				</Form>
			</FormBox>
		)
	}
}

export default connect(
	state => ({
		oldPassword: state.profile.oldPassword,
		password: state.profile.password,
		repeatPassword: state.profile.repeatPassword,
		error: state.profile.error,
		success: state.profile.success,
		loading: state.profile.loading
	}),
	dispatch => ({
		setOldPassword: password => dispatch({type: SET_OLD_PASSWORD, password}),
		setPassword: password => dispatch({type: SET_PASSWORD, password}),
		setRepeatPassword: password => dispatch({type: SET_REPEAT_PASSWORD, password}),
		saveProfile: (ev) => {
			ev.preventDefault()
			return dispatch(saveProfile())
		}
	})
)(ResetPassword)
