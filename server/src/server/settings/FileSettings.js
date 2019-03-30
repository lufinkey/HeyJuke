const EventEmitter = require('events').EventEmitter;
const fs = require('fs');

class FileSettings extends EventEmitter {
    constructor(path, watch = true) {
        super();
        this.path = path;
        this.state = undefined;
        this.shouldWatch = watch;
        this.watcher = undefined;
    }

    async load() {
        return await new Promise((resolve, reject) =>
            fs.readFile(this.path, (err, data) => {
                if (err != null) {
                    this.close();
                    console.log(err); // TODO: This is a pretty common thing, make it nicer logging wise
                    this.state = {};
                } else {
                    this.state = JSON.parse(data);
                    if (this.shouldWatch && this.watcher === undefined) {
                        this.watcher = fs.watch(this.path, {
                            persistent: false
                        });
                        this.watcher.on('change', () => {
                            this.load().then()
                        })
                    }
                }

                this.emit('change', this);
                resolve({});
            }))
    }

    async save() {
        return await new Promise((resolve, reject) => {
            fs.writeFile(this.path, JSON.stringify(this.state), (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    close() {
        if (this.watcher !== undefined) {
            this.watcher.close();
            this.watcher = undefined
        }
    }
}

module.exports = FileSettings;