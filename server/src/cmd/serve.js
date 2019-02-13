// serve

exports.command = ['serve', '$0']

exports.builder = {
    httpPort: {
        default: 8085
    },
    wsPort: {
        default: 8086
    }
}

exports.handler = function(argv) {
    console.log("tried to serve")
}
