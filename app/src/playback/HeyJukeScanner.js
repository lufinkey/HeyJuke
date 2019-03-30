// @flow

import { Buffer } from 'buffer';
import EventEmitter from 'events';
import { createSocket } from 'react-native-udp';
import AsyncQueue from '../util/AsyncQueue';


type SocketSender = {
	address: string,
	family: 'IPv4' | 'IPv6',
	port: number,
	size: number
}

type StartScanOptions = {
	port: number
}

export type HeyJukeConnection = {
	address: string,
	port: number,
	lastMessageTime: number
}


class HeyJukeScanner extends EventEmitter {
	_asyncQueue: AsyncQueue = new AsyncQueue();
	_connections: Array<HeyJukeConnection> = [];
	_socket: ?Object = null;
	_starting: boolean = false;
	_connectionExpireInterval: ?any = null;

	async start(options: StartScanOptions) {
		await this._asyncQueue.run(async () => {
			if(this._socket != null) {
				return;
			}

			this._starting = true;
			const socket: Object = createSocket('udp4');

			await new Promise((resolve, reject) => {
				// listening handler
				socket.once('listening', () => {
					if(this._starting) {
						this._starting = true;
						this._socket = socket;
						this._startConnectionExpireInterval();
						resolve();
					}
				});
				// error handler
				socket.on('error', (error) => {
					if(this._starting) {
						this._starting = false;
						socket.close(() => {
							reject(error);
						});
					}
					else {
						this.emit('error', error);
					}
				});
				// message handler
				socket.on('message', (message: Buffer, sender: SocketSender) => {
					this._onMessage(message, sender);
				});
				socket.on('close', () => {
					this._socket = null;
					this._stopConnectionExpireInterval();
				});
				// bind socket to port
				socket.bind(options.port);
			});
		});
	}

	async stop() {
		await this._asyncQueue.run(async () => {
			const socket = this._socket;
			if(socket == null) {
				return;
			}
			return new Promise((resolve, reject) => {
				socket.close(() => {
					resolve();
				});
			});
		});
	}

	get scanning(): boolean {
		return (this._socket != null);
	}

	get connections(): Array<HeyJukeConnection> {
		return this._connections.slice(0);
	}

	_onMessage(message: Buffer, sender: SocketSender) {
		for(let i=0; i<this._connections.length; i++) {
			const connection = this._connections[i];
			if(connection.address === sender.address && connection.port === sender.port) {
				this._connections.splice(i, 1);
				break;
			}
		}
		// TODO verify that packet is a HeyJuke packet
		this._connections.push({
			address: sender.address,
			port: sender.port,
			lastMessageTime: (new Date()).getTime()
		});
		this.emit('connectionFound', this.connections);
	}

	_startConnectionExpireInterval() {
		if(this._connectionExpireInterval != null) {
			return;
		}
		this._connectionExpireInterval = setInterval(this._onConnectionExpireInterval.bind(this), 3.0);
	}

	_stopConnectionExpireInterval() {
		if(this._connectionExpireInterval == null) {
			return;
		}
		clearInterval(this._connectionExpireInterval);
		this._connectionExpireInterval = null;
	}

	_onConnectionExpireInterval() {
		// filter outdated connections
		const currentTime = (new Date()).getTime();
		for(let i=0; i<this._connections.length; i++) {
			const connection = this._connections[i];
			if((currentTime - connection.lastMessageTime) > 20) {
				this._connections.splice(i, 1);
				i--;
			}
		}
	}
}

export default new HeyJukeScanner();
