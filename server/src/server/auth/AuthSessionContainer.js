const crypto = require('crypto')
const http = require('http')

function generateAuthToken() {
    return crypto.randomBytes(21).toString('base64')
}

class NoCapabilities {
    async has(capability) {
        return Promise.resolve(false)
    }
}

const _global_nocapabilites = NoCapabilities() 

class AuthSessionContainer {
    constructor(defaultCapabilities=_global_nocapabilites) {
        this._auths = {}
        this._defaultCapabilities = defaultCapabilities
    }

    _createUnusedAuthToken() {
        let token;
        do {
            token = generateAuthToken()
        } while (this._auths.hasOwnProperty(token))
        return token
    }

    /**
     * Creates a new capability token for a passed capability
     */
    createAuthorizationToken(capabilities) {
        const token = this._createUnusedAuthToken()

        this._auths[token] = capabilities
        return token
    }

    /**
     * Invalidate a token. Returns whether or not the token was previously valid.
     */
    invalidateAuthorization(token) {
        if (!this._auths.hasOwnProperty(token))
            return false

        delete this._auths[token]
        return true
    }

    /**
     * Returns the capabilites for a passed token.
     */
    getCapabilitiesForAuthorization(token) {
        const capabilities = this._auths[token]
        if (capabilities === undefined)
            return null
        return capabilities
    }

    populate(enforceCorrect=true) {
        const ref = this
        return async function(req, res, next) {
            if (!req.header.hasOwnProperty("X-Auth-Token")) {
                req.capabilities = ref._defaultCapabilities
            } else {
                req.capabilities = ref.getCapabilitiesForAuthorization(ctx.header["X-Auth-Token"])
                if (req.capabilities === null && enforceCorrect) {
                }
            }
                
        }
    }

    /**
     * Returns koa middleware that enforces that the requester has the capability
     * passed.
     */
    mustHaveCapability(capability) {
        const ref = this
        return async function(ctx, next) {

        }
    }
}

module.exports = AuthSessionContainer
