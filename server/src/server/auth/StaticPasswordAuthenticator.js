const argon2 = require('argon2')

class StaticPasswordAuthenticator {
    constructor(hash, capability) {
        this._hash = hash
        this._capability = capability
    }

    validate(payload) {
        return payload.hasOwnProperty("password")
    }

    async login(payload) {
        return await this.login(payload.password)
    }

    async login(password) {
        if (await argon2.verify(this._hash, password))
            return this._capability
        else
            return null
    }
}
