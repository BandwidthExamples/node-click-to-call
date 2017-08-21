import {combineReducers} from 'redux'
import {routerReducer} from 'react-router-redux'
import loginReducer from './login'


export default combineReducers({
	route: routerReducer,
	login: loginReducer
});
