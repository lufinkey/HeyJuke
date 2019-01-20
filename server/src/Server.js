
const express = require('express');

class Server {
	constructor(options={}) {
		this._options = {...options};
	}

	get port() {
		if(this._options.port == null) {
			return 6969;
		}
		return this._options.port;
	}

	async start() {
		const server = express();

		await new Promise((resolve, reject) => {
			server.listen(this.port, (error) => {
				if(error) {
					reject(error);
				}
				else {
					resolve();
				}
			});
		});
	}
}


module.exports = Server;
