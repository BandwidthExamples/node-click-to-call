import request from '../request'
import {UPDATE_CALL} from './calls'


export const GET_PROFILE = 'PROFILE/GET_PROFILE'
export const SAVE_PROFILE = 'PROFILE/SAVE_PROFILE'
export const SET_OLD_PASSWORD = 'PROFILE/SET_OLD_PASSWORD'
export const SET_PASSWORD = 'PROFILE/SET_PASSWORD'
export const SET_REPEAT_PASSWORD = 'PROFILE/SET_REPEAT_PASSWORD'


export function saveProfile() {
	return request(SAVE_PROFILE, `/profile`, 'POST', 'profile')
}

let source = null

export function getProfile() {
	return async (dispatch, getState) => {
		if (source) {
			source.close()
			source = null
		}
		await dispatch(request(GET_PROFILE, '/profile'))
		const state = getState()
		if (state.profile.id) {
			if (window.EventSource) {
				source = new window.EventSource(`/buttons/sse?id=${state.profile.id}`);
				source.onmessage = event => {
					const state = getState()
					const call = JSON.parse(event.data)
					if (call.button === state.calls.buttonId) {
						dispatch({type: UPDATE_CALL, call})
					}
				}
			}
		}
	}
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
