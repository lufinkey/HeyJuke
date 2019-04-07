const process = require('process');
const EventEmitter = require('events').EventEmitter;

const {diff} = require('deep-object-diff');

const FileSettings = require('./FileSettings');

const ENV_REPLACEMENT_PATTERN = /%(.+)%/;

const SETTINGS_DEFAULT_SEARCH_PATH = "/etc/heyjuke.json;%HOME%/heyjuke.json;./heyjuke.json;./heyjuke.app.json";
const SETTINGS_DEFAULT_AUTOSAVE_PATH = "./heyjuke.app.json";

const defaults = {};

function performEnvReplacement(s) {
    return s.replace(ENV_REPLACEMENT_PATTERN, (match, env) => {
        if (process.env.hasOwnProperty(env))
            return process.env[env];
        return ""
    })
}

class Settings extends EventEmitter {
    constructor(searchPath = SETTINGS_DEFAULT_SEARCH_PATH,
                autosavePath = SETTINGS_DEFAULT_AUTOSAVE_PATH) {
        super();
        const searches = searchPath.split(';');
        this.settings = undefined;
        this.settingsInstances = [];

        this.settingsViaPath = new Map();
        const settingsViaPath = this.settingsViaPath;
        const doCollapse = () => this.collapse();

        function getOrCreate(path) {
            let s = settingsViaPath.get(path);
            if (s === undefined) {
                s = new FileSettings(path);
                s.on('change', doCollapse);
                settingsViaPath.set(path, s);
                return {settings: s, is_new: true}
            } else {
                return {settings: s, is_new: false}
            }
        }

        for (const search of searches) {
            const path = performEnvReplacement(search);

            const r = getOrCreate(path);
            this.settingsInstances.push(r.settings);
        }

        const autosaveResult = getOrCreate(performEnvReplacement(autosavePath));
        if (autosaveResult.is_new)
            console.log("WARNING: Autosave path not within the search path!");
        this.autosave = autosaveResult.settings;
    }

    broadcastDiff(prefix, d) {
        for (const i in d) {
            if (!d.hasOwnProperty(i))
                continue;

            let path = prefix;
            if (path !== "")
                path += ".";
            path += i;

            const e = d[i];

            if (typeof e === "object")
                this.broadcastDiff(path, e);
            else
                this.emit(path, i)
        }
    }

    async resolve(previous = undefined) {
        const promises = [];
        for (const instance of this.settingsViaPath) {
            promises.push(instance[1].load())
        }
        await Promise.all(promises);

        const col = this.collapse();

        if (previous === undefined)
            previous = {};

        const d = diff(previous, col);
        this.broadcastDiff("", d);
        return col;
    }

    get settableSettings() {
        return this.autosave.state
    }

    async setSettings(settings) {
        const previous = this.settings;
        this.autosave.state = settings;
        await this.autosave.save();
        await this.resolve(previous)
    }

    collapse() {
        this.settings = {};
        for (const instance of this.settingsInstances) {
            const instSettings = instance.state;
            this.settings = Object.assign(this.settings, instSettings);
        }

        return this.settings
    }
}

module.exports = Settings;