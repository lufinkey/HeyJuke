const Koa = require('koa')
const Router = require('koa-router')
const WebSocket = require('ws');
const Queue = require('./Queue');


const WEB_SERVER_PORT = 8085;
const WEB_SOCKET_PORT = 8086;


class HeyJukeServer {
	constructor(options={}) {
		this._options = {...options};

		this._expressApp = null;
		this._webServer = null;
		this._webSocketServer = null;
		this._webSocket = null;

		this._queue = new Queue();
	}

	get webServerPort() {
		return this._options.webServerPort || WEB_SERVER_PORT;
	}

	get webSocketPort() {
		return this._options.webSocketPort || WEB_SOCKET_PORT;
	}

	async _startWebSocketServer() {
		if(this._webSocketServer) {
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
				this.onSocketError(error);
			});
			webSocket.on('message', (message) => {
				this.onSocketMessage(message);
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
				webSocketServer.close();
			}
		});
		webSocketServer.on('close', () => {
			this._webSocketServer = null;
		});
	}

	async _stopWebSocketServer() {
		if(!this._webSocketServer) {
			return;
		}
		await new Promise((resolve, reject) => {
			this._webSocketServer.close(() => {
				resolve();
			});
		});
		this._webSocketServer = null;
	}

	async _startWebServer() {
		if(this._webServer) {
			throw new Error("web server has already started");
		}
		else if(this._expressApp) {
			throw new Error("web server is already starting");
        }
        

		const expressApp = express();
        this._expressApp = expressApp;
		let webServer = null;
		await new Promise((resolve, reject) => {
			webServer = expressApp.listen(this.port, (error) => {
				if(error) {
					this._expressApp = null;
					reject(error);
				}
				else {
					resolve();
				}
			});
		});
		this._webServer = webServer;
	}

	async _stopWebServer() {
		if(!this._webServer) {
			return;
		}
		this._webServer.close();
		this._webServer = null;
		this._expressApp = null;
	}

	async start() {
		try {
			await this._startWebSocketServer();
			await this._startWebServer();
		}
		catch(error) {
			await this._stopWebServer();
			await this._stopWebSocketServer();
			throw error;
		}
	}

	async stop() {
		await this._stopWebServer();
		await this._stopWebSocketServer();
	}

	onSocketError(error) {
		// TODO handle electron error
	}

	onSocketMessage(message) {
		// TODO handle electron message
	}
}


module.exports = HeyJukeServer;