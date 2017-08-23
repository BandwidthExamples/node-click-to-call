import request from '../request'

export const CREATE_RESET_PASSWORD_REQUEST = 'RESET_PASSWORD_REQUEST/CREATE_RESET_PASSWORD_REQUEST'

export const SET_EMAIL = 'RESET_PASSWORD_REQUEST/SET_EMAIL'

export function createResetPasswordRequest() {
	return request(CREATE_RESET_PASSWORD_REQUEST, '/reset-password-request', 'POST', 'resetPasswordRequest')
}

export default (state = {}, action) => {
	switch (action.type) {
		case SET_EMAIL: {
			return {...state, email: action.email}
		}
		case `${CREATE_RESET_PASSWORD_REQUEST}_ERROR`: {
			return {...state, error: action.error, loading: false}
		}
		case `${CREATE_RESET_PASSWORD_REQUEST}_START`: {
			return {...state, error: null, loading: true}
		}
		case `${CREATE_RESET_PASSWORD_REQUEST}_SUCCESS`: {
			return {...state, error: null, success: true, loading: false}
		}
		default: {
			return {...state}
		}
	}
}
