import request from '../request'

export const GET_PROFILE = 'PROFILE/GET_PROFILE'

export function getProfile() {
	return request(GET_PROFILE, '/profile')
}

export default (state = {}, action) => {
	switch (action.type) {
		case `${GET_PROFILE}_SUCCESS`: {
			return {...state, ...action.result}
		}
		default: {
			return {...state}
		}
	}
}
