import request from '../request'

export const LOGIN = 'LOGIN/LOGIN'
export const LOGOUT = 'LOGIN/LOGOUT'
export const SET_EMAIL = 'LOGIN/SET_EMAIL'
export const SET_PASSWORD = 'LOGIN/SET_PASSWORD'


export function login() {
	return request(LOGIN, '/login', 'POST', 'login')
}

export function logout() {
	return request(LOGOUT, '/logout', 'POST')
}

export default (state = {}, action) => {
	switch (action.type) {
		case SET_EMAIL: {
			return {...state, email: action.email}
		}
		case SET_PASSWORD: {
			return {...state, password: action.password}
		}
		case `${LOGIN}_ERROR`: {
			return {...state, error: action.error, loading: false}
		}
		case `${LOGIN}_START`: {
			return {...state, error: null, loading: true}
		}
		default: {
			return {...state}
		}
	}
}
