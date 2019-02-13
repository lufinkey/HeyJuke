const crypto = require('crypto');

function generateAuthToken() {
    return crypto.randomBytes(21).toString('base64')
}

class AuthSessionContainer {
    constructor() {
        this._auths = {};
    }

    _createUnusedAuthToken() {
        let token;
        do {
            token = generateAuthToken()
        } while (this._auths.hasOwnProperty(token));
        return token
    }

    /**
     * Creates a new capability token for a passed capability
     */
    createAuthorizationToken(capabilities) {
        const token = this._createUnusedAuthToken();

        this._auths[token] = capabilities;
        return token
    }

    /**
     * Invalidate a token. Returns whether or not the token was previously valid.
     */
    invalidateAuthorization(token) {
        if (!this._auths.hasOwnProperty(token))
            return false;

        delete this._auths[token];
        return true
    }

    /**
     * Returns the capabilites for a passed token.
     */
    getCapabilitiesForAuthorization(token) {
        const capabilities = this._auths[token];
        if (capabilities === undefined)
            return null;
        return capabilities
    }
}

module.exports = AuthSessionContainer;
