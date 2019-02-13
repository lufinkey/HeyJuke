const argon2 = require('argon2');
const {BadRequest, Unauthorized} = require('../s15n/ApiError');

class StaticPasswordAuthenticator {
    constructor(hash, capability) {
        this._hash = hash;
        this._capability = capability
    }

    static validate(payload) {
        return payload.hasOwnProperty("password")
    }

    async login(payload) {
        if (payload.password === "undefined")
            throw new BadRequest("Payload is missing 'password'");

        if (await argon2.verify(this._hash, payload.password))
            return this._capability;
        else
            throw new Unauthorized("Password is incorrect")
    }
}

module.exports = StaticPasswordAuthenticator;