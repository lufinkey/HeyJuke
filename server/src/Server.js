
const express = require('express');
const WebSocket = require('ws');


const WEB_SERVER_PORT = 8085;
const WEB_SOCKET_PORT = 8086;


class Server {
	constructor(options={}) {
		this._options = {...options};

		this._webServer = null;
		this._webSocketServer = null;
		this._webSocket = null;
	}

	get webServerPort() {
		return this._options.webServerPort || WEB_SERVER_PORT;
	}

	get webSocketPort() {
		return this._options.webSocketPort || WEB_SOCKET_PORT;
	}

	async _startWebSocketServer() {
		if(this._webSocketServer != null) {
			throw new Error("web socket server has already started");
		}
		let listening = false;
		const webSocketServer = new WebSocket.Server({
			port: this.webSocketPort
		});
		this._webSocketServer = webSocketServer;
		webSocketServer.on('connection', (webSocket) => {
			if(this._webSocket != null) {
				webSocket.close();
				return;
			}
			this._webSocket = webSocket;
			webSocket.on('error', (error) => {
				onSocketError(error);
			});
			webSocket.on('message', (message) => {
				onSocketMessage(message);
			});
			webSocket.on('close', (code, reason) => {
				console.log("web socket closed: "+code+": "+reason);
				this._webSocket = null;
			});
		});
		webSocketServer.on('listening', () => {
			listening = true;
		});
		webSocketServer.on('error', () => {
			if(!listening) {
				this._webSocketServer = null;
				this._webSocketServer.close();
			}
		});
		webSocketServer.on('close', () => {
			this._webSocketServer = null;
		});
	}

	async _startWebServer() {
		if(this._webServer != null) {
			throw new Error("web server has already started");
		}
		const webServer = express();
		this._webServer = webServer;
		await new Promise((resolve, reject) => {
			webServer.listen(this.port, (error) => {
				if(error) {
					this._webServer = null;
					reject(error);
				}
				else {
					resolve();
				}
			});
		});
	}

	async start() {
		await this._startWebSocketServer();
		await this._startWebServer();
	}

	onSocketError(error) {
		// TODO handle electron error
	}

	onSocketMessage(message) {
		// TODO handle electron message
	}
}


module.exports = Server;
