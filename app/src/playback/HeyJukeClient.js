// @flow

import * as QueryString from 'querystring';

import AsyncQueue from '../util/AsyncQueue';
import type {
	HeyJukeConnection
} from './HeyJukeScanner';

import {
	Track
} from '../library/types';
import {
	YoutubeProvider
} from '../library/providers';


class HeyJukeClient {
	_connection: ?HeyJukeConnection = null;
	_authToken: ?string = null;
	_updatingConnection: boolean = false;
	_connectionQueue = new AsyncQueue();

	_sendRequest(connection: HeyJukeConnection, options: {endpoint: string, method: string, params: any, authToken?: ?string}) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.responseType = 'arraybuffer';
			xhr.onreadystatechange = () => {
				if(xhr.readyState === 4) {
					const data = JSON.parse(Buffer.from((xhr.response != null) ? xhr.response : xhr.responseText).toString('utf8'));
					if(xhr.status === 200) {
						resolve(data);
					}
					else {
						const error = new Error(data.message);
						(error: any).code = `HTTP${data.errorCode}`;
						reject(error);
					}
				}
			};
			xhr.onerror = (error) => {
				reject(error);
			};
			let url = `http://${connection.address}:${connection.port}/${options.endpoint}`;
			if(['GET','DELETE'].includes(options.method)) {
				url += '?'+QueryString.stringify(options.params);
			}
			xhr.open(options.method, url);
			if(options.authToken != null) {
				xhr.setRequestHeader('X-Auth-Token', options.authToken);
			}
			if(options.params != null && !['GET','DELETE'].includes(options.method)) {
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.send(JSON.stringify(options.params));
			}
			else {
				xhr.send();
			}
		});
	}

	async setConnection(connection: HeyJukeConnection) {
		return await this._connectionQueue.run(async () => {
			this._updatingConnection = true;
			try {
				const { token } = await this._sendRequest(connection, {
					endpoint: 'auth/login',
					method: 'POST',
					params: {
						method: 'anonymous'
					}
				});
				this._authToken = token;
				this._connection = connection;
				this._updatingConnection = false;
			}
			catch(error) {
				this._updatingConnection = false;
				throw error;
			}
		});
	}

	get connection(): ?HeyJukeConnection {
		return this._connection;
	}

	get isUpdatingConnection(): boolean {
		return this._updatingConnection;
	}


	async sendRequest(method: string, endpoint: string, params: any) {
		const connection = this._connection;
		if(connection == null) {
			throw new Error("Not connected to server");
		}
		return await this._sendRequest(connection, {
			method,
			endpoint,
			params,
			authToken: this._authToken
		});
	}

	async addTrackToQueue(track: Track) {
		let uri = track.uri;
		if(track.provider.name === 'youtube') {
			const { id } = YoutubeProvider.parseURI(uri);
			uri = `youtube.com/v/${id}?version=3`;
		}
		return await this.sendRequest('POST', 'queue', {
			uri: uri,
			source: track.provider.name
		});
	}

	async getSetting(key: string) {
		return await this.sendRequest('GET', 'settings', {
			path: key
		});
	}

	async setSetting(key: string, value: any) {
		return await this.sendRequest('POST', 'settings', {
			[key]: value
		});
	}
}

export default new HeyJukeClient();
