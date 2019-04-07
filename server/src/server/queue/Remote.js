const WebSocket = require('ws');
const EventEmitter = require('events').EventEmitter;

class Remote extends EventEmitter {
    constructor(port) {
        super();

        this.client = null;
        let listening = false;
        this.server = new WebSocket.Server({
            port
        });

        this.server.on('error', err => {
            if (!listening)
                this.close()
        });

        this.server.on('close', () => {
            this.emit('close', {});
        });

        this.server.on('listening', () => {
            listening = true;
        });

        this.server.on('connection', (ws) => {
            if (this.client !== null) {
                ws.close(401, "Client already connected");
            }

            this.client = ws;

            this.client.on('message', m => {
                this.onMessage(m)
            });

            this.client.on('close', (code, reason) => {
                console.log("web socket closed: " + code + ": " + reason);
                this.client = null;
            });
            this.emit('connected', {});
        });
    }

    _get_client() {
        if (this.client === null)
            throw new Error("Client not yet connected!");
        else
            return this.client;

    }

    send_command(cmd) {
        const client = this._get_client();
        client.send(JSON.stringify(cmd))
    }

    play_song(song) {
        this.send_command({
            "command": "play-song",
            "source": song.source,
            "uri": song.uri
        })
    }

    continue() {
        this.send_command({
            "command": "continue"
        })
    }

    stop() {
        this.send_command({
            "command": "stop"
        })
    }

    onMessage(message) {
        const msg = JSON.parse(message);
        if (!msg.domain === "playback") return;
        if (!msg.status === "waiting") return;
        this.emit('waiting', {});
    }

    async close() {
        return new Promise((resolve, reject) => {
            this.server.close(() => resolve())
        });
    }
}

module.exports = Remote;