
class QueueEntry {
    constructor(owner, source, uri) {
        this.owner = owner;
        this.uri = uri;
        this.source = source;
    }

    async canAdminstrate(token, capabilities) {
        if (this.owner === token) return true;
        return await capabilities.has("queue.delete");
    }
}

module.exports = QueueEntry;