
class QueueEntry {
    constructor(auth, uri) {
        this.auth = auth;
        this.uri = uri;
    }

    canAdminstrate(token, capabilities) {

    }
}

module.exports = QueueEntry;