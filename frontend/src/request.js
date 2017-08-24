export default function request(action, path, method='GET', stateName='', options={}) {
	return async function(dispatch, getState) {
		dispatch({type: `${action}_START`})
		options.credentials = 'same-origin'
		if (stateName) {
			const state = getState()
			if (state[stateName]) {
				options.body = JSON.stringify(state[stateName]);
				options.headers = options.headers || {}
				options.headers['Content-Type'] = 'application/json'
			}
		}
		try {
			const r = await fetch(path, {method, ...options})
			dispatch({type: `${action}_SUCCESS`, result: await checkResponse(r)})
		} catch (err) {
			dispatch({type: `${action}_ERROR`, error: err.message})
			// throw err
		}
	}
}

async function checkResponse(r) {
	if((r.headers.get('Content-Type') || '').indexOf('/json') >= 0) {
			const json = await r.json();
			if (json.error) {
					throw new Error(json.error);
			}
			return json;
	}
	if(!r.ok) {
			const message = await r.text();
			throw new Error(message || r.statusText);
	}
}
