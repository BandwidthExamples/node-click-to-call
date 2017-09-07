import React from 'react'
import moment from 'moment'
import {Table, Spacing, Alert, Pagination, Button, Flow} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {goBack} from 'react-router-redux'
import {getCalls, SET_PAGE, SET_BUTTON_ID} from '../store/calls'

class Calls extends React.Component {
	columns = [
    {name: 'createdAt', displayName: 'Started'},
		{name: 'answeredAt', displayName: 'Answered'},
		{name: 'duration', displayName: 'Duration'},
		{name: 'completed', displayName: 'Completed'}
	]

	componentWillMount() {
		this.props.getCalls(this.props.match.params.id)
	}

	renderRow(item) {
		return (<Table.Row key={item.id}>
			<Table.Cell>{moment(item.createdAt).format('LLL')}</Table.Cell>
			<Table.Cell>{moment(item.answeredAt).format('LLL')}</Table.Cell>
			<Table.Cell>{item.duration}</Table.Cell>
			<Table.Cell>{item.completed ? 'Yes': 'No'}</Table.Cell>
		</Table.Row>)
	}

	renderDetails(item) {
		if (!item.completed) {
			return null
		}
		return (
			<Spacing>
				<div>
					<a href={`/buttons/${item.button}/calls/${item.id}/audio`} target="_blank">Recorded call</a>
				</div>
				{item.transcribedText &&
				(<div>
					<h5>Transcribed text</h5>
					<p>{item.transcribedText}</p>
				</div>)}
			</Spacing>)
	}

	render() {
		const {error, loading, calls, page, pageCount, pageSelected, goBack} = this.props
		const renderRow = this.renderRow.bind(this)
		const renderDetails = this.renderDetails.bind(this)
		return (
			<Spacing>
				<h2>Calls</h2>
				{error && <Alert type="error">{error}</Alert>}
				<Flow>
					<Flow.Row>
						<Table.Simple items={calls} columns={this.columns} renderRow={renderRow} renderDetails={renderDetails} loading={loading}>
						</Table.Simple>
					</Flow.Row>
					<Flow.Row>
						{pageCount > 0 && !loading && (<Pagination pageCount={pageCount} currentPage={page-1} onPageSelected={pageSelected} />)}
					</Flow.Row>
					<Flow.Row>
						<Button onClick={goBack}>Back</Button>
					</Flow.Row>
				</Flow>
			</Spacing>
		)
	}
}

export default connect(
	state => ({
		calls: state.calls.calls || [],
		error: state.calls.error,
		loading: state.calls.loading,
		page: state.calls.page,
		pageCount: state.calls.pageCount
	}),
	dispatch => ({
		getCalls: (id) => {
			dispatch({type: SET_BUTTON_ID, id })
			dispatch(getCalls())
		},
		pageSelected: page => {
			dispatch({type: SET_PAGE, page: page + 1 })
			dispatch(getCalls())
		},
		goBack: () => dispatch(goBack())
	})
)(Calls)
