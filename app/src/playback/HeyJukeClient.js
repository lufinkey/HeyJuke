// @flow

import AsyncQueue from '../util/AsyncQueue';
import type {
	HeyJukeConnection
} from './HeyJukeScanner';


class HeyJukeClient {
	_connection: ?HeyJukeConnection = null;
	_authToken: ?string = null;
	_updatingConnection: boolean = false;
	_connectionQueue = new AsyncQueue();

	_sendRequest(connection: HeyJukeConnection, options: {endpoint: string, method: string, body: any, authToken?: ?string}) {
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
			xhr.open(options.method, `http://${connection.address}:${connection.port}/${options.endpoint}`);
			if(options.authToken != null) {
				xhr.setRequestHeader('X-Auth-Token', options.authToken);
			}
			if(options.body != null) {
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.send(JSON.stringify(options.body));
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
					body: {
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
}

export default new HeyJukeClient();
