import React from 'react'
import PropTypes from 'prop-types'
import {ConnectedRouter} from 'react-router-redux'


export default class App extends React.Component {
	render() {
		console.log('render')
		return (
			<ConnectedRouter history={this.props.history}>
				<h1>Router</h1>
			</ConnectedRouter>
		)
	}
}

App.propTypes = {
	history: PropTypes.object
}
