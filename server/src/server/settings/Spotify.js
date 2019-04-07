const https = require('https');
const crypto = require('crypto');
const EventEmitter = require('events').EventEmitter;
const QueryString = require('querystring');

const spotifyEndpoint = 'https://accounts.spotify.com/api/token';

// TODO: This should not at all be hardcoded like this
const encSecret = "2eNve7tHOyFtzBCeBxID";
const encMethod = "aes-256-ctr";
const encrypt = (text) => {
    const aes = crypto.createCipher(encMethod, encSecret);
    let encrypted = aes.update(text, 'utf8', 'hex');
    encrypted += aes.final('hex');
    return encrypted;
};

const decrypt = (text) => {
    const aes = crypto.createDecipher(encMethod, encSecret);
    let decrypted = aes.update(text, 'hex', 'utf8');
    decrypted += aes.final('utf8');
    return decrypted;
};


class Spotify extends EventEmitter {
    constructor(settings) {
        super();
        this.settings = settings;
        this.refreshTask = undefined;

        const thx = this;

        function setupRefresh() {

            if (thx.refreshTask !== undefined)
                clearInterval(thx.refreshTask);

            const s = thx.settings.settings.spotify;
            if (!s.hasOwnProperty("tokenExpiration") ||
                !s.hasOwnProperty("clientId") ||
                !s.hasOwnProperty("refreshToken") ||
                this.settings.settings.spotify_secrets.hasOwnProperty("clientSecret"))
                return;

            thx.refreshTask = setInterval(() => {
                thx.refresh().then(() => console.log("Refreshed spotify")).catch(e => {
                    clearInterval(thx.refreshTask);
                    thx.refreshTask = undefined;
                    console.log("Automatic refresh failed: " + e);
                });
            }, (thx.settings.settings.spotify.tokenExpiration - Date.now()) / 3)
        }

        this.settings.on("spotify.tokenExpiration", setupRefresh);
        this.settings.on("spotify.clientId", setupRefresh);
        this.settings.on("spotify_secrets.clientSecret", setupRefresh);
        this.settings.on("spotify.refreshToken", setupRefresh);

        setupRefresh()
    }

    async postRequest(url, data = {}) {
        return new Promise((resolve, reject) => {
            // build request data
            const authString = Buffer.from(this.settings.settings.spotify.clientId + ':' + this.settings.settings.spotify_secrets.clientSecret).toString('base64');
            const authHeader = `Basic ${authString}`;
            url = new URL(url);
            const reqData = {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };

            // create request
            const req = https.request(reqData, (res) => {
                // build response
                let buffers = [];
                res.on('data', (chunk) => {
                    buffers.push(chunk);
                });

                res.on('end', () => {
                    // parse response
                    let result = null;
                    try {
                        result = Buffer.concat(buffers);
                        result = result.toString();
                        var contentType = res.headers['content-type'];
                        if (typeof contentType == 'string') {
                            contentType = contentType.split(';')[0].trim();
                        }
                        if (contentType === 'application/x-www-form-urlencoded') {
                            result = QueryString.parse(result);
                        } else if (contentType === 'application/json') {
                            result = JSON.parse(result);
                        }
                    } catch (error) {
                        error.response = res;
                        error.data = result;
                        reject(error);
                        return;
                    }
                    resolve({response: res, result: result});
                });
            });

            // handle error
            req.on('error', (error) => {
                reject(error);
            });

            // send
            data = QueryString.stringify(data);
            req.write(data);
            req.end();
        });
    }

    async swap(code) {
        // build request data
        const reqData = {
            grant_type: 'authorization_code',
            redirect_uri: this.settings.settings.spotify.redirectURL,
            code: req.body.code
        };

        // get new token from Spotify API
        const {response, result} = await postRequest(
            spotifyEndpoint, reqData);

        // encrypt refresh_token
        if (result.refresh_token) {
            result.refresh_token = encrypt(result.refresh_token);
        }

        return result
    }

    async refresh() {
        // decrypt token
        const refreshToken = decrypt(this.settings.settings.spotify.refreshToken);
        // build request data
        const reqData = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        };
        // get new token from Spotify API
        const {response, result} = await postRequest(spotifyEndpoint, reqData);

        // encrypt refresh_token
        if (result.refresh_token) {
            result.refresh_token = encrypt(result.refresh_token);
        }

        const ss = this.settings.settableSettings;
        ss.spotify.refreshToken = result.refresh_token;
        ss.spotify.tokenExpiration = Date.now() + (result.expires_in * 1000);
        await this.settings.setSettings(ss);

        return result;
    }
}

module.exports = Spotify;