
class AnonymousAuthenticator {
    constructor(capability) {
        this._capability = capability
    }

    static validate(payload) {
        return true;
    }

    async login(payload) {
        return this._capability
    }
}

module.exports = AnonymousAuthenticator;