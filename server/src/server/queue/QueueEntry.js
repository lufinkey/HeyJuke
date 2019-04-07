
class QueueEntry {
    constructor(owner, source, uri, uid) {
        this.owner = owner;
        this.source = source;
        this.uri = uri;
        this.uid = uid;
    }

    async canAdminstrate(token, capabilities) {
        if (this.owner === token) return true;
        return await capabilities.has("queue.delete");
    }
}

module.exports = QueueEntry;