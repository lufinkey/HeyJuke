const dgram = require('dgram');
const ip = require('ip');
const os = require('os');

function collectAddresses(bind) {
    const networkAddrs = [];
    const ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(ifname => {
        ifaces[ifname].forEach(iface => {
            if (iface.internal) return;
            if (bind !== undefined && bind !== "0.0.0.0"
                && iface.address !== bind)
                return;
            networkAddrs.push(iface)
        })
    });

    return networkAddrs;
}

class Beaconer {
    constructor(cport, name, bind, port) {
        this.port = port || 42069;
        this.cport = cport;
        this.bcastAddrs = collectAddresses(bind);
        this.name = name;
    }

    async socketBind() {
        if (this.sockets !== undefined)
            this.close();

        this.sockets = [];

        const promises = [];
        for (const addr of this.bcastAddrs) {
            const type = "udp" + (ip.isV4Format(addr.address) ? "4" : "6");
            // TODO: why doesn't this work?
            if (type === "udp6")
                continue;

            const sock = dgram.createSocket({
                type: type,
                reuseAddr: true
            });

            this.sockets.push({
                sock,
                addr
            });

            promises.push(new Promise(resolve => {
                sock.bind({
                    port: 42069,
                    address: addr.address,
                    exclusive: false
                }, () => {
                    sock.setBroadcast(true);
                    resolve();
                });
            }))
        }

        return await Promise.all(promises)
    }

    startTimer() {
        this.timer = setInterval(() => this.doBroadcasts(), 3000);
    }

    doBroadcasts() {
        for (const sa of this.sockets) {
            const payload = Buffer.from(JSON.stringify(
                {
                    version: 0,
                    host: sa.addr.address,
                    port: this.cport,
                    id: this.name
                }
            ));

            const bc = ip.cidrSubnet(sa.addr.cidr).broadcastAddress;

            sa.sock.send(payload, 0, payload.length, this.port, "255.255.255.255")
        }
    }

    close() {
        if (this.sockets !== undefined) {
            for (const sa of this.sockets) {
                sa.sock.close()
            }

            this.sockets = undefined
        }

        if (this.timer !== undefined) {
            clearInterval(this.timer);
            this.timer = undefined
        }
    }
}

module.exports = Beaconer;