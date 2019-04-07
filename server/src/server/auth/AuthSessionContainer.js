const crypto = require('crypto');

function generateAuthToken() {
    return crypto.randomBytes(21).toString('base64')
}

class AuthSessionContainer {
    constructor(deflt) {
        this._auths = new Map();
        this._defaultCapability = deflt;
    }

    _createUnusedAuthToken() {
        let token;
        do {
            token = generateAuthToken()
        } while (this._auths.has(token));
        return token
    }

    /**
     * Creates a new capability token for a passed capability
     */
    createAuthorizationToken(capabilities) {
        const token = this._createUnusedAuthToken();

        this._auths.set(token, capabilities);
        console.log(`auths:${JSON.stringify(this._auths.entries())} ${this._auths.has(token)}`);

        return token
    }

    /**
     * Invalidate a token. Returns whether or not the token was previously valid.
     */
    invalidateAuthorization(token) {
        if (!this._auths.has(token))
            return false;

        this._auths.delete(token);
        return true
    }

    /**
     * Returns the capabilites for a passed token.
     */
    getCapabilitiesForAuthorization(token) {
        console.log(`auths:${JSON.stringify(this._auths.entries())} ${this._auths.has(token)}`);
        const capabilities = this._auths.get(token);
        if (capabilities === undefined)
            return null;
        return capabilities
    }

    getCapabilitiesForRequest(req) {
        if (!req.headers.hasOwnProperty("x-auth-token"))
            return this._defaultCapability;

        return this.getCapabilitiesForAuthorization(req.headers["x-auth-token"]);
    }
}

module.exports = AuthSessionContainer;
