
const Server = require('./src/Server');

const server = new Server();
server.start().then(() => {
	// started server
	console.log("started web server on port "+server.webServerPort);
	console.log("started web socket server on port "+server.webSocketPort);
}).catch((error) => {
	// error;
	console.error(error);
	process.exit(1);
});
