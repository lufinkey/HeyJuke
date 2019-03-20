
const {readdir, stat} = require('fs');
const npath = require('path');
const {parseFile} = require('music-metadata');

const SUPPORTED_FILEENDINGS = [
    ".mp3"
];

// NOTE: This is a non-supported method of grabbing the documents from the current index. Use with caution!
function getAllDocs(index) {
    return index.documentStore.docs;
}

function idFromStat(path, statOf) {
    return JSON.stringify({
        path: path,
        mdate: statOf.ctimeMs
    })
}

// TODO: this class won't survive a loop of symlinks - pro tip, don't give it one.
//  the right behavior would be to stop recursion when a directory has already been analyzed
class LocalDbUpdate {
    constructor(index, rootPath) {
        this.index = index;
        this.rootPath = rootPath;
        this.indexedDocs = new Set();
        const docs = getAllDocs(index);
        Object.keys(docs).forEach(doc => {
            this.indexedDocs.add(doc)
        });

        this.queue = [{
            path: this.rootPath,
            hint: this.includePath
        }];

        this.modifications = 0;
    }

    async processQueueElement() {
        const element = this.queue.pop();
        const path = element.path;
        const hint = element.hint;

        await hint.bind(this)(path);
    }

    async processFullQueue() {
        while (this.queue.length > 0)
            await this.processQueueElement();

        await this.finalize();
    }

    async includeFile(path, statHint = undefined) {
        if (statHint === undefined) {
            statHint = await new Promise((resolve, reject) =>
                stat(path, (err, stats) => {
                    if (err) reject(err);
                    else resolve(stats);
                })
            )
        }

        const rpath = npath.relative(this.rootPath, path);

        const hash = idFromStat(rpath, statHint);

        if (this.indexedDocs.has(hash)) {
            // yay! no work to be done
            this.indexedDocs.delete(hash);
            return;
        }

        // So the indexedDocs doesn't have our file, we need to index it
        // Lets grab our metadata out of the file.

        const metadata = await parseFile(path);

        const document = {
            hash: hash,
            year: metadata.common.year || '',
            title: metadata.common.title || npath.basename(path, npath.extname(path)),
            artist: metadata.common.artist || '',
            album: metadata.common.album || ''
        };

        this.index.addDoc(document);
        this.modifications++;
    }

    async includeDirectory(path) {
        const dlist = await new Promise((resolve, reject) =>
            readdir(path, {withFileTypes: true}, (err, files) => {
                if (err) reject(err);
                else resolve(files);
            })
        );

        const update = this;

        dlist.forEach(e => {
            const hint = function (e) {
                if (e.isFile()) {
                    if (SUPPORTED_FILEENDINGS.indexOf(npath.extname(e.name).toLowerCase()) === -1) {
                        return;
                    }
                    return update.includeFile;
                } else if (e.isDirectory()) {
                    return update.includeDirectory;
                } else if (e.isSymbolicLink()) { // So what are you really... we don't know!
                    return update.includePath;
                } else {
                    return null;
                }
            }(e);
            if (hint === undefined) return;

            this.queue.push({
                path: npath.join(path, e.name),
                hint: hint
            })
        })
    }

    async includePath(path) {
        const pstat = await new Promise((resolve, reject) =>
            stat(path, (err, stats) => {
                if (err) reject(err);
                else resolve(stats);
            })
        );

        if (pstat.isDirectory())
            await this.includeDirectory(path);
        else if (pstat.isFile())
            await this.includeFile(path, pstat);
    }

    finalize() {
        this.indexedDocs.forEach(unfoundDoc => {
            const doc = this.index.documentStore.getDoc(unfoundDoc);
            if (doc === null) {// something went very wrong
                console.log("Something went very wrong!");
                return
            }

            console.log("Removing stale document: " + JSON.stringify(doc));

            this.index.removeDoc(doc);
            this.modifications++;
        })
    }
}

module.exports = LocalDbUpdate;