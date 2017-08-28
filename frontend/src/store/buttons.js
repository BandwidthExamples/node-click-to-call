import request from '../request'

export const GET_BUTTONS = 'BUTTONS/GET_BUTTONS'
export const CREATE_BUTTON = 'BUTTONS/CREATE_BUTTON'
export const REMOVE_BUTTON = 'BUTTONS/REMOVE_BUTTON'
export const TOGGLE_BUTTON = 'BUTTONS/TOGGLE_BUTTON'
export const SORT_COLUMN = 'BUTTONS/SORT_COLUMN'
export const SET_BUTTON_ID = 'BUTTONS/SET_BUTTON_ID'

export const SET_NUMBER = 'BUTTONS/SET_NUMBER'

export function getButtons() {
	return request(GET_BUTTONS, `/buttons`, 'GET')
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
			return {...state, createButtonNumber: action.number}
		}
		case `${CREATE_BUTTON}_ERROR`: {
			return {...state, error: action.error, creating: false}
		}
		case `${CREATE_BUTTON}_START`: {
			return {...state, error: null, creating: true, createButton: {number: state.createButtonNumber}}
		}
		case `${CREATE_BUTTON}_SUCCESS`: {
			const {buttons} = state
			action.result.isNew = true
			buttons.unshift(action.result)
			return {...state, error: null, creating: false, success: true, buttons}
		}
		case `${GET_BUTTONS}_ERROR`: {
			return {...state, error: action.error, loading: false}
		}
		case `${GET_BUTTONS}_START`: {
			return {...state, error: null, loading: true, createButton: {}, buttons: []}
		}
		case `${GET_BUTTONS}_SUCCESS`: {
			return {...state, error: null, loading: false, buttons: action.result || []}
		}
		case `${REMOVE_BUTTON}_START`: {
			return {...state, error: null}
		}
		case `${REMOVE_BUTTON}_ERROR`: {
			return {...state, id: null, error: action.error}
		}
		case `${REMOVE_BUTTON}_SUCCESS`: {
			const {id, buttons} = state
			return {...state, error: null, id: null, buttons: buttons.filter(b => b.id !== id)}
		}
		case `${TOGGLE_BUTTON}_START`: {
			return {...state, error: null, updateButton: {enabled: !(state.buttons.filter(b => b.id === state.id)[0]).enabled}}
		}
		case `${TOGGLE_BUTTON}_ERROR`: {
			return {...state, id: null, error: action.error}
		}
		case `${TOGGLE_BUTTON}_SUCCESS`: {
			const {id, buttons} = state
			const button = buttons.filter(b => b.id === id)[0]
			button.enabled = !button.enabled
			return {...state, error: null, id: null, updateButton: null, buttons}
		}
		case SORT_COLUMN: {
			const buttons = state.buttons || []
			buttons.sort((a, b) => a[action.column].toString().localeCompare(b[action.column].toString()) * action.sortOrder)
			return {...state, buttons}
		}
		case SET_BUTTON_ID: {
			return {...state, id: action.id}
		}
		default: {
			return {...state}
		}
	}
}
