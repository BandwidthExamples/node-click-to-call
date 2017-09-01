import React from 'react'
import moment from 'moment'
import {Table, Spacing, Toggle, Button, Alert, Form, FlexFields, TextField, SubmitButtonField, Code} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {toggleButton, removeButton, getButtons, createButton, SORT_COLUMN, SET_NUMBER, SET_BUTTON_ID} from '../store/buttons'

const escape = document.createElement('textarea')
function escapeHTML(html) {
    escape.textContent = html
    return escape.innerHTML
}

class Buttons extends React.Component {
	columns = [
    {name: 'number', displayName: 'Number', sortable: true},
		{name: 'enabled', displayName: 'Enabled', sortable: true},
		{name: 'createdAt', displayName: 'Created', sortable: true},
		{name: 'actions', displayName: ''}
	]

	componentWillMount() {
		this.props.getButtons()
	}

	renderRow(item) {
		return (<Table.Row key={item.id} className={item.deleted ? 'deleted' : ''}>
			<Table.Cell>{item.number}</Table.Cell>
			<Table.Cell>{!item.deleted && (<Toggle value={item.enabled} onChange={() => this.props.toggleButton(item.id)}/>)}</Table.Cell>
			<Table.Cell>{moment(item.createdAt).format('LLL')}</Table.Cell>
			<Table.Cell>{!item.deleted && (<Button onClick={ev => this.props.removeButton(ev, item.id)}>Remove</Button>)}<Button onClick={ev => this.props.showCalls(ev, item.id)}>Calls</Button></Table.Cell>
		</Table.Row>)
	}

	renderDetails(item) {
		if (item.deleted) {
			return null
		}
		const script = escapeHTML(`<script src="${window.location.origin}/click.js"></script>`)
		const link = escapeHTML(`<a class="click-to-call" data-id="${item.id}" href="#">Call</a>`)
		const button = escapeHTML(`<button class="click-to-call" data-id="${item.id}">Call</button>`)
		return (
			<Spacing>
				<p>Add this script to you page</p>
				<Code dangerouslySetInnerHTML={{__html: script}}></Code>
				<p>Then add code of next link/button where you need on your page</p>
				<h5>Link code</h5>
				<Code dangerouslySetInnerHTML={{__html: link}}></Code>
				<h5>Button code</h5>
				<Code dangerouslySetInnerHTML={{__html: button}}></Code>
			</Spacing>)
	}

	render() {
		const {error, loading, creating, createButtonNumber, createButton, setNumber, buttons, handleSortChanged} = this.props
		const renderRow = this.renderRow.bind(this)
		const renderDetails = this.renderDetails.bind(this)
		return (
			<Spacing>
				{error && <Alert type="error">{error}</Alert>}
				<Form onSubmit={ev => createButton(ev)}>
					<FlexFields>
						<TextField
							label="Phone Number"
							name="number"
							type="tel"
							input={{
								value: createButtonNumber,
								onChange: ev => setNumber(ev.target.value)
							}}
							required
						/>
					</FlexFields>
					<SubmitButtonField loading={creating}>Create button</SubmitButtonField>
				</Form>
				<Spacing/>
				<Table.Simple items={buttons} columns={this.columns} renderRow={renderRow} renderDetails={renderDetails} onSortChanged={handleSortChanged} loading={loading}>
				</Table.Simple>
			</Spacing>
		)
	}
}

export default connect(
	state => ({
		buttons: state.buttons.buttons || [],
		createButtonNumber: state.buttons.createButtonNumber,
		error: state.buttons.error,
		loading: state.buttons.loading,
		creating: state.buttons.creating
	}),
	dispatch => ({
		toggleButton: id => {
			dispatch({type: SET_BUTTON_ID, id: id})
			dispatch(toggleButton(id))
		},
		removeButton: (ev, id) => {
			ev.preventDefault()
			if (window.confirm('Are you sure?')) {
				dispatch({type: SET_BUTTON_ID, id: id})
				dispatch(removeButton(id))
			}
		},
		setNumber: number => {
			dispatch({type: SET_NUMBER, number})
		},
		getButtons: () => dispatch(getButtons()),
		createButton: ev => {
			ev.preventDefault()
			dispatch(createButton())
		},
		handleSortChanged: (column, sortOrder) => dispatch({type: SORT_COLUMN, column, sortOrder}),
		showCalls: (ev, id) => {
			ev.preventDefault()
			dispatch(push(`/calls/${id}`))
		}
	})
)(Buttons)
