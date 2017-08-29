import request from '../request'

export const GET_CALLS = 'CALLS/GET_CALLS'
export const SET_BUTTON_ID = 'CALLS/SET_BUTTON_ID'
export const SET_PAGE = 'CALLS/SET_PAGE'
export const UPDATE_CALL = 'CALLS/UPDATE_CALL'

export function getCalls() {
	return (dispatch, getState) => {
		const state = getState()
		return dispatch(request(GET_CALLS, `/buttons/${state.calls.buttonId}/calls?page=${state.calls.page || 1}`, 'GET'))
	}
}

export default function (state = {}, action) {
	switch (action.type) {
		case `${GET_CALLS}_ERROR`: {
			return {...state, error: action.error, loading: false}
		}
		case `${GET_CALLS}_START`: {
			const calls = state.calls || []
			return {...state, error: null, loading: true, calls}
		}
		case `${GET_CALLS}_SUCCESS`: {
			const {page, pageCount, calls} = action.result
			return {...state, error: null, loading: false, calls, page, pageCount}
		}
		case SET_BUTTON_ID: {
			return {...state, buttonId: action.id}
		}
		case SET_PAGE: {
			return {...state, page: action.page}
		}
		case UPDATE_CALL: {
			if ((state.page || 1) > 1) {
				return {...state}
			}
			const calls = state.calls || []
			const {call} = action
			let i =0
			for(i = 0; i < calls.length; i ++) {
				if (calls[i].id === call.id) {
					calls.splice(i, 1, call)
					break
				}
			}
			if (i === calls.length) {
				calls.unshift(call)
			}
			return {...state, calls}
		}
		default: {
			return {...state}
		}
	}
}
