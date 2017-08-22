import request from '../request'

export const REGISTER = 'REGISTER'

export const SET_EMAIL = 'SET_EMAIL'
export const SET_PASSWORD = 'SET_PASSWORD'
export const SET_REPEAT_PASSWORD = 'SET_REPEAT_PASSWORD'


export function register() {
	return request(REGISTER, '/register', 'POST', 'register')
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
		case `${REGISTER}_ERROR`: {
			return {...state, error: action.error}
		}
		case `${REGISTER}_START`: {
			return {...state, error: null}
		}
		default: {
			return {...state}
		}
	}
}
