const fs = require('fs');
const path = require('path');
const url = require('url');

const {SUPPORTED_FILEENDINGS} = require('./LocalDbUpdate');

class LocalDbCollection {
    constructor(collections = new Map) {
        this.collections = collections
    }

    addCollection(identifier, collection) {
        if (this.hasCollection(identifier)) {
            throw new Error("Attempted to add a collection with an identifier which already existed in the collection");
        }

        this.collections.set(identifier, collection);
    }

    removeCollection(identifier) {
        if (!this.hasCollection(identifier)) {
            throw new Error("Attempted to remove collection with an identifier which did not exist in the collection");
        }

        this.collections.delete(identifier);
    }

    // may return undefined
    getCollection(identifier) {
        return this.collections.get(identifier);
    }

    hasCollection(identifier) {
        return this.collections.has(identifier);
    }

    async isValidLocalUri(uri) {
        let _path;
        try {
            _path = url.fileURLToPath(uri);
        } catch (e) {
            if (typeof e === TypeError) {
                return false
            } else {
                throw e
            }
        }

        // Lets make sure the extension is supported
        if (SUPPORTED_FILEENDINGS.indexOf(path.extname(_path).toLowerCase()) === -1) {
            return false;
        }

        // This goes through and validates that the user isn't just sending us BS to try to play
        for (const entry of this.collections) {
            // We do this without trying to normalize _path because it shouldn't need
            // normalized if its legit.
            if (!entry.rootPath.startsWith(_path)) {
                continue;
            }

            // Now that we have a chance of it being an okay file, lets validate we
            // can even read it to begin with.
            const err = await new Promise((resolve, reject) =>
                fs.access(_path, fs.constants.R_OK, resolve));

            return !err;
        }

        return false;
    }

    query(term) {
        let results = [];
        for (const result of this.collections) {
            const db = result[1];
            const localResults = db.index.search(term);
            for (const o of localResults) {
                // We have to go back through and repopulate the id3 info
                const doc = db.index.documentStore.getDoc(o.ref);
                o["id3"] = {
                    title: doc.title,
                    artist: doc.artist,
                    album: doc.album,
                    year: doc.year
                };
                o["uri"] = path.join(db.rootPath, doc.path);
                delete o["ref"];
            }

            results = results.concat(localResults);
        }

        results.sort(function (a, b) {
            return b.score - a.score;
        });
        return results
    }
}

module.exports = LocalDbCollection;