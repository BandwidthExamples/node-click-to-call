import request from '../request'

export const GET_PROFILE = 'PROFILE/GET_PROFILE'
export const SAVE_PROFILE = 'PROFILE/SAVE_PROFILE'
export const SET_OLD_PASSWORD = 'PROFILE/SET_OLD_PASSWORD'
export const SET_PASSWORD = 'PROFILE/SET_PASSWORD'
export const SET_REPEAT_PASSWORD = 'PROFILE/SET_REPEAT_PASSWORD'


export function saveProfile() {
	return request(SAVE_PROFILE, `/profile`, 'POST', 'profile')
}


export function getProfile() {
	return request(GET_PROFILE, '/profile')
}

export default (state = {}, action) => {
	switch (action.type) {
		case `${GET_PROFILE}_SUCCESS`: {
			return {...action.result, loaded: true}
		}
		case SET_OLD_PASSWORD: {
			return {...state, oldPassword: action.password}
		}
		case SET_PASSWORD: {
			return {...state, password: action.password}
		}
		case SET_REPEAT_PASSWORD: {
			return {...state, repeatPassword: action.password}
		}
		case `${SAVE_PROFILE}_ERROR`: {
			return {...state, error: action.error, loading: false}
		}
		case `${SAVE_PROFILE}_START`: {
			return {...state, error: null, loading: true}
		}
		case `${SAVE_PROFILE}_SUCCESS`: {
			return {...state, error: null, loading: false, success: true, oldPassword: '', password: '', repeatPassword: ''}
		}
		default: {
			return {...state}
		}
	}
}
