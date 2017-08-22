import {combineReducers} from 'redux'
import {routerReducer} from 'react-router-redux'
import loginReducer from './login'
import registerReducer from './register'
import resetPasswordRequestReducer from './resetPasswordRequest'


export default combineReducers({
	route: routerReducer,
	login: loginReducer,
	register: registerReducer,
	resetPasswordRequest: resetPasswordRequestReducer
});