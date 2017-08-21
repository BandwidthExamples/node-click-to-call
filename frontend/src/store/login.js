import request from 'request'
import {push} from 'react-router-redux'

const LOGIN = 'LOGIN'
const LOGOUT = 'LOGOUT'


export function login() {
	return (dispatch, getState) => {
		request(LOGIN, '/login', 'POST').then(() => push('/'))
	}
}

export function logout() {
	return (dispatch, getState) => {
		request(LOGOUT, '/logout', 'POST').then(() => push('/login'))
	}
}

export default (state = {}, action) => {
	switch (action.type) {
	}
	return {...state}
}
