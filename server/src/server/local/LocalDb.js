const {readFile, writeFile} = require('fs');
const {join} = require('path');
const {LocalDbUpdate} = require('./LocalDbUpdate');

const elasticlunr = require('elasticlunr');
// Stopwords don't make any sense for what we are trying to do
elasticlunr.clearStopWords();


class LocalDb {
    constructor(index, rootPath, dbPath) {
        this.index = index;
        this.rootPath = rootPath;
        this.dbPath = dbPath;
        this.dirty = false;


        this.index.on('add', () => this.markDirty());
        this.index.on('update', () => this.markDirty());
        this.index.on('remove', () => this.markDirty());
    }

    markDirty() {
        this.dirty = true;
    }

    async saveIndex(force = false) {
        if (!force && !this.dirty) return false;

        await new Promise(((resolve, reject) => {
            writeFile(this.dbPath, JSON.stringify(this.index.toJSON()), err => {
                if (err) reject(err);
                resolve();
            })
        }));

        this.dirty = false;

        return true;
    }

    query(term) {
        return this.index.search(term);
    }

    createUpdateHelper() {
        return new LocalDbUpdate(this.index, this.rootPath);
    }
}

const FIELDS = [
    "year",
    "title",
    "artist",
    "album",
];

function createIndex() {
    for (const f in FIELDS) {
        this.addField(FIELDS[f]);
    }
    this.setRef('hash');
}

async function loadOrCreate(rootPath, dbPath) {
    let el;
    try {
        const data = await new Promise((resolve, reject) => {
            readFile(dbPath, (err, data) => {
                if (err) reject(err);
                resolve(data);
            });
        });

        const indexRaw = JSON.parse(data);
        el = elasticlunr.Index.load(indexRaw);
    } catch (e) {
        // If the file doesn't exist, thats okay!
        if (e.code !== 'ENOENT')
            throw e;
        el = elasticlunr(createIndex);
    }
    return new LocalDb(el, rootPath, dbPath);
}

const DATABASE_FILE = 'heyjuke_metadata.json';
async function createLocalDb(sourceRoot) {
    const dbfilepath = join(sourceRoot, DATABASE_FILE);

    return await loadOrCreate(sourceRoot, dbfilepath);
}

module.exports = {createLocalDb};
