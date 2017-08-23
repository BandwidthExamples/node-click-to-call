import request from '../request'

export const RESET_PASSWORD = 'RESET_PASSWORD/RESET_PASSWORD'

export const SET_EMAIL = 'RESET_PASSWORD/SET_EMAIL'
export const SET_PASSWORD = 'RESET_PASSWORD/SET_PASSWORD'
export const SET_REPEAT_PASSWORD = 'RESET_PASSWORD/SET_REPEAT_PASSWORD'


export function resetPassword(token) {
	return request(RESET_PASSWORD, `/reset-password/${token}`, 'POST', 'resetPassword')
}

export default (state = {}, action) => {
	switch (action.type) {
		case SET_EMAIL: {
			return {...state, email: action.email}
		}
		case SET_PASSWORD: {
			return {...state, password: action.password}
		}
		case SET_REPEAT_PASSWORD: {
			return {...state, repeatPassword: action.password}
		}
		case `${RESET_PASSWORD}_ERROR`: {
			return {...state, error: action.error}
		}
		case `${RESET_PASSWORD}_START`: {
			return {...state, error: null}
		}
		default: {
			return {...state}
		}
	}
}
