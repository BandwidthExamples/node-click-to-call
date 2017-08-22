import request from '../request'
import {push} from 'react-router-redux'

export const LOGIN = 'LOGIN'
export const LOGOUT = 'LOGOUT'
export const SET_EMAIL = 'SET_EMAIL'
export const SET_PASSWORD = 'SET_PASSWORD'


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
			return {...state, error: action.error}
		}
		case `${LOGIN}_START`: {
			return {...state, error: null}
		}
	}
	return {...state}
}
