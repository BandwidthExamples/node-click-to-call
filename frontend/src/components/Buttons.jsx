import React from 'react'
import moment from 'moment'
import {Table, Spacing, Toggle, Button, Alert, Form, FlexFields, TextField, SubmitButtonField} from '@bandwidth/shared-components'
import {connect} from 'react-redux'
import {toggleButton, removeButton, getButtons, createButton, SORT_COLUMN, SET_NUMBER, SET_BUTTON_ID} from '../store/buttons'

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
		return (<Table.Row key={item.id} className={item.isNew && "new-row"}>
			<Table.Cell>{item.number}</Table.Cell>
			<Table.Cell><Toggle value={item.enabled} onChange={() => this.props.toggleButton(item.id)}/></Table.Cell>
			<Table.Cell>{moment(item.createdAt).format('LLL')}</Table.Cell>
			<Table.Cell><Button onClick={() => this.props.removeButton(item.id)}>Remove</Button></Table.Cell>
		</Table.Row>)
	}

	render() {
		const {error, loading, creating, createButtonNumber, createButton, setNumber, buttons, handleSortChanged} = this.props
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
				<Table.Simple items={buttons} columns={this.columns} renderRow={this.renderRow} onSortChanged={handleSortChanged} loading={loading}>
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
		removeButton: id => {
			dispatch({type: SET_BUTTON_ID, id: id})
			dispatch(removeButton(id))
		},
		setNumber: number => {
			dispatch({type: SET_NUMBER, number})
		},
		getButtons: () => dispatch(getButtons()),
		createButton: ev => {
			ev.preventDefault()
			dispatch(createButton())
		},
		handleSortChanged: (column, sortOrder) => dispatch({type: SORT_COLUMN, column, sortOrder})
	})
)(Buttons)
