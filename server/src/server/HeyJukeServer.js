const express = require('express');
const WebSocket = require('ws');
const Queue = require('./Queue');

const WEB_SERVER_PORT = 8085;
const WEB_SOCKET_PORT = 8086;


class HeyJukeServer {
    constructor() {
        this._expressApp = null;
        this._webServer = null;
        this._webSocketServer = null;
        this._webSocket = null;

        this._queue = new Queue();
    }

    get webServerPort() {
        return this.settings.webServerPort || WEB_SERVER_PORT;
    }

    get webSocketPort() {
        return this.settings.webSocketPort || WEB_SOCKET_PORT;
    }

    async _loadSettings() {
        const Settings = require('./settings/Settings');
        this._settings = new Settings();
        await this._settings.resolve();
    }

     get settings() {
         return this._settings.settings
     }

    async _startWebServer() {
        if (this._webServer) {
            throw new Error("web server has already started");
        } else if (this._expressApp) {
            throw new Error("web server is already starting");
        }

        const expressApp = express();
        this._expressApp = expressApp;

        const Capability = require('./auth/StaticCapabilities');
        const StaticPasswordAuthenticator = require('./auth/StaticPasswordAuthenticator');
        const AnonymousAuthenticator = require('./auth/AnonymousAuthenticator');
        const Container = require('./auth/AuthSessionContainer');
        const AuthManager = require('./auth/AuthManager');
        const {createLocalDb} = require('./local/LocalDb');
        const LocalDbCollection = require('./local/LocalDbCollection');
        const Beacon = require('./beacon/Beacon');

        this.beacon = new Beacon(this.webServerPort, this.settings.server_id, "0.0.0.0");
        await this.beacon.socketBind();
        this.beacon.startTimer();

        expressApp.use(require('morgan')(process.env.NODE_ENV === "production" ? 'common' : 'dev'));
        expressApp.use(express.json());

        const capset = new Map();

        const unauthSet = new Set();
        for (const s of this.settings.permissions.unauthenticated)
            unauthSet.add(s);

        const unauthedCapability = new Capability(unauthSet);

        const authSet = new Set(unauthSet);
        for (const s of this.settings.permissions.authenticated)
            unauthSet.add(s);
        const authedCapability = new Capability(authSet);

        const session = new Container(unauthedCapability);

        const local = new LocalDbCollection();
        for (const id in this.settings.local_sources) {
            if (!this.settings.local_sources.hasOwnProperty(id)) continue;

            const db = await createLocalDb(this.settings.local_sources[id]);
            const update = db.createUpdateHelper();
            await update.processFullQueue();
            await db.saveIndex();

            local.addCollection(id, db);
        }

        expressApp.use('/auth', require('./auth/Routes')(
            new AuthManager(
                {
                    "password": new StaticPasswordAuthenticator(
                        this.settings.main_password_hash,
                        authedCapability
                    ),
                    "anonymous": new AnonymousAuthenticator(
                        unauthedCapability
                    )
                }),
            session));

        expressApp.use('/local', require('./local/Routes')(
            session, local
        ));

        const Remote = require('./queue/Remote');
        const Queue = require('./queue/Queue');
        const remote = new Remote(this.webSocketPort);
        const queue = new Queue(remote);

        expressApp.use('/queue', require('./queue/Routes')(session, queue));


        const Spotify = require('./settings/Spotify');
        this._spotify = new Spotify(this._settings);
        expressApp.use('/settings', require('./settings/Routes')(session, this._settings, this._spotify));

        expressApp.use(require('./s15n/ErrorHandler'));
        let webServer = null;
        await new Promise((resolve, reject) => {
            webServer = expressApp.listen(this.webServerPort, (error) => {
                if (error) {
                    this._expressApp = null;
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
        this._webServer = webServer;
    }

    async _stopWebServer() {
        if (!this._webServer) {
            return;
        }
        this._webServer.close();
        this._webServer = null;
        this._expressApp = null;
    }

    async start() {
        try {
            await this._loadSettings();
            await this._startWebServer();
        } catch (error) {
            await this._stopWebServer();
            console.log(error)
        }
    }

    async stop() {
        await this._stopWebServer();
        if (this.beacon !== undefined) {
            this.beacon.close();
            this.beacon = undefined
        }

        if (this.remote !== undefined) {
            this.remote.close();
            this.remote = undefined
        }
    }
}


module.exports = HeyJukeServer;
