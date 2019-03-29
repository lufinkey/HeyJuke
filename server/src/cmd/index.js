// index

const {createLocalDb} = require('../server/local/LocalDb');

exports.command = 'index <path> [query]';

exports.handler = async function(argv) {
    const path = argv.path;

    const localDb = await createLocalDb(path);
    console.log(`Loaded index with ${localDb.index.documentStore.docs.length} preindexed items`);

    const updater = localDb.createUpdateHelper();
    console.log("Indexing entire directory as well as sub-directories");
    await updater.processFullQueue();
    console.log(`Performed ${updater.modifications} updates to the index`);

    const didSave = await localDb.saveIndex();
    if (didSave)
        console.log("New index saved.");

    if (argv.query) {
        const query = argv.query;
        console.log(localDb.query(query))
    }
};
