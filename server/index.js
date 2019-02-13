#!/usr/bin/env node

require('yargs')
    .usage('Usage: $0 <command> [options]')
    .commandDir('./src/cmd')
    .demandCommand()
    .help()
    .argv
    
/*

const HeyJukeServer = require('./src/HeyJukeServer');

const server = new HeyJukeServer();
server.start().then(() => {
	// started server
	console.log("started web server on port "+server.webServerPort);
	console.log("started web socket server on port "+server.webSocketPort);
}).catch((error) => {
	// error;
	console.error(error);
	process.exit(1);
});*/
