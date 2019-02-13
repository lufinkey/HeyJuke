const {BadRequest} = require('../s15n/ApiError');

class AuthManager {
    constructor(authenticators={}) {
        this._authenticators = authenticators
    }

    getMethods() {
        return Object.keys(this._authenticators)
    }

    async authenticateFor(payload) {
        if (!payload.method)
            throw new BadRequest("Payload is missing 'method'");

        const auth = this._authenticators[payload.method];
        if (auth === undefined)
            throw new BadRequest("Authentication method invalid");

        return await auth.login(payload)
    }
}

module.exports = AuthManager;