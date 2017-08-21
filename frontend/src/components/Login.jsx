import React from 'react'
import {Form, FormBox, TextField, FlexFields, SubmitButtonField} from '@bandwidth/shared-components'
import {Field, reduxForm} from 'redux-form'
import {connect} from 'react-redux'
import {login} from '../store/login'

class Login extends React.Component {
	render() {
		const {handleSubmit} = this.props
		return (
			<FormBox>
				<Form onSubmit={handleSubmit}>
					<FlexFields>
						<Field
							name="email"
							component="input"
							type="email"
							placeholder="Email"
						/>
					</FlexFields>
					<FlexFields>
						<Field
							name="password"
							component="input"
							type="password"
							placeholder="Password"
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
	})
)(reduxForm({form: 'Login'})(Login))
