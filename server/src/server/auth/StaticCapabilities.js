class StaticCapabilities {
    constructor(capabilities) {
        this._capabilities = capabilities
    }
    

    async has(capability) {
        // This specific capabilities implementation doesn't require async, but
        // others in the future may.
        return Promise.resolve(this._capabilities.hasOwnProperty(capability))
    }
}

module.exports = StaticCapabilities;
