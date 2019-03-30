// serve

exports.command = ['serve', '$0'];

exports.builder = {
    webServerPort: {
        default: 8085
    },
    webSocketPort: {
        default: 8086
    }
};

exports.handler = function(argv) {
    const HJS = require('../server/HeyJukeServer');
    try {
        new HJS(argv).start();
    } catch (e) {
        console.log(e)
    }

    console.log("Done.")
};
