
const Server = require('./src/Server');

const server = new Server();
server.start().then(() => {
	// started server
}).catch((error) => {
	// error;
	console.error(error);
	process.exit(1);
});
