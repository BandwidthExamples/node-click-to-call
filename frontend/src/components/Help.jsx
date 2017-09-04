import React from 'react'
import {Spacing, Code, CodeBlock, Flow} from '@bandwidth/shared-components'

const escape = document.createElement('textarea')
function escapeHTML(html) {
    escape.textContent = html
    return escape.innerHTML
}

export default class Help extends React.Component {
	render() {
		const script = escapeHTML(`<script src="${window.location.origin}/click.js"></script>`)
		const link = escapeHTML(`<a class="click-to-call" data-id="YOUR_BUTTON_ID" href="#">Call</a>`)
		const button = escapeHTML(`<button class="click-to-call" data-id="YOUR_BUTTON_ID">Call</button>`)
		const link2 = escapeHTML(`<a class="click-to-call" data-id="YOUR_BUTTON_ID" data-call-progress-class-name="YOUR_CLASS_NAME" href="#">Call</a>`)
		const demo = `import {prepare} from 'click' // where 'click' is alias to '${window.location.origin}/click.js'\n` +
`// in your component/directive\n` +
`prepare(el, {id: 'YOUR_BUTTON_ID'}) // el is html element A or BUTTON\n\n` +
`// more complex demo with using own call proggress ui\n` +
`prepare(el, {` +
`	id: 'YOUR_BUTTON_ID',\n` +
`	showCallProgress: ({number, hangup}) => {\n` +
`		// Show your progress  here. Call 'hangup()' to complete a call.\n` +
`	},\n` +
`	hideCallProgress: () => {\n` +
`		// Hide your progress ui here\n` +
`	}\n` +
`})`
		return (
			<Spacing>
				<h3>Simple usage of button</h3>
				<p>Add script to you page</p>
				<Code dangerouslySetInnerHTML={{__html: script}}></Code>
				<p>And then add one of snippets</p>
				<Code dangerouslySetInnerHTML={{__html: link}}></Code>
				<p>or</p>
				<Code dangerouslySetInnerHTML={{__html: button}}></Code>
				<h3>Using own CSS class for call process</h3>
				<Code dangerouslySetInnerHTML={{__html: link2}}></Code>
				<h3>Using dynamic generated HTML (with Angular, React, Vue, etc)</h3>
				<Code dangerouslySetInnerHTML={{__html: demo}}></Code>
			</Spacing>
		)
	}
}

