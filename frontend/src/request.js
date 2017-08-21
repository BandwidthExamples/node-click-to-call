export default function request(action, path, method='GET', options={}) {
	return function(dispatch, getState) {
		debugger
		dispatch({type: `${action}_START`})
		debugger
		return fetch(path, {method, ...options}).then(r => {
			try {
				dispatch({type: `${action}_SUCCESS`, result: checkResponse(r)})
			} catch (err) {
				dispatch({type: `${action}_ERROR`, error: err.message})
			}
		}, err => {
			dispatch({type: `${action}_ERROR`, error: err.message})
		});
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
