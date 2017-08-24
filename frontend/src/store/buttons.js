import request from '../request'

export const GET_BUTTONS = 'BUTTONS/GET_BUTTONS'
export const CREATE_BUTTON = 'BUTTONS/CREATE_BUTTON'
export const REMOVE_BUTTON = 'BUTTONS/REMOVE_BUTTON'
export const TOGGLE_BUTTON = 'BUTTONS/TOGGLE_BUTTON'

export const SET_NUMBER = 'BUTTONS/SET_NUMBER'

export function getButtons() {
	return request(GET_BUTTONS, `/buttons`, 'GET', 'buttons')
}

export function createButton() {
	return request(CREATE_BUTTON, `/buttons`, 'POST', 'buttons.createButton')
}

export function toggleButton(id) {
	return request(TOGGLE_BUTTON, `/buttons/${id}`, 'POST', 'buttons.updateButton')
}

export function removeButton(id) {
	return request(REMOVE_BUTTON, `/buttons/${id}`, 'DELETE')
}

export default function (state = {}, action) {
	switch (action.type) {
		case SET_NUMBER: {
			return {...state, createButton: {number: action.number}}
		}
		case `${CREATE_BUTTON}_ERROR`: {
			return {...state, error: action.error, loading: false}
		}
		case `${CREATE_BUTTON}_START`: {
			return {...state, error: null, loading: true}
		}
		case `${CREATE_BUTTON}_SUCCESS`: {
			return {...state, error: null, loading: false, success: true, createButton: {}}
		}
		case `${GET_BUTTONS}_ERROR`: {
			return {...state, error: action.error, loading: false}
		}
		case `${GET_BUTTONS}_START`: {
			return {...state, error: null, loading: true}
		}
		case `${GET_BUTTONS}_SUCCESS`: {
			return {...state, error: null, loading: false, buttons: action.buttons}
		}
		case `${REMOVE_BUTTON}_START`: {
			return {...state, error: null, removingId: action.id}
		}
		case `${REMOVE_BUTTON}_ERROR`: {
			return {...state, error: action.error}
		}
		case `${REMOVE_BUTTON}_SUCCESS`: {
			const {removingId, buttons} = state
			return {...state, error: null, removingId: null, buttons: buttons.filter(b => b.id !== removingId)}
		}
		case `${TOGGLE_BUTTON}_START`: {
			return {...state, error: null, toggleId: action.id, updateButton: {enabled: !(state.buttons.filter(b.id === action.id)[0]).enabled}}
		}
		case `${TOGGLE_BUTTON}_ERROR`: {
			return {...state, error: action.error}
		}
		case `${TOGGLE_BUTTON}_SUCCESS`: {
			const {toggleId, buttons} = state
			const button = buttons.filter(b => b.id === toggleId)[0]
			button.enabled = !button.enabled
			return {...state, error: null, toggleId: null, updateButton: null, buttons}
		}
		default: {
			return {...state}
		}
	}
}
