const router = require('express').Router();
const {BadRequest, Unauthorized} = require('../s15n/ApiError');

module.exports = function (session, settings) {
    router.get('/', (req, res, next) => {
        if (req.query["path"] === undefined)
            throw new BadRequest("No path for settings sent");

        const path = req.query["path"];

        const capabilities = session.getCapabilitiesForRequest(req);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        capabilities.has("settings.get." + path).then(function (has) {
            if (has) {
                const pbp = path.split(".");
                let context = settings.settings;
                for (let i = 0; i < pbp.length; i++) {
                    if (!context.hasOwnProperty(pbp[i])) {
                        // So, the path doesn't exist. We return an empty object to signify this.
                        res.status(404).send({})
                    }
                    context = context[pbp[i]]
                }

                const resp = {};
                resp[path] = context;

                res.status(200).send(resp)

            } else
                throw new Unauthorized("Not permitted to get settings path " + path);
        }).catch(err => next(err))
    });

    router.post('/', (req, res, next) => {
        if (req.query["path"] === undefined)
            throw new BadRequest("No path for settings sent");

        const path = req.query["path"];

        if (req.body === undefined)
            throw new BadRequest("Body undefined");
        if (req.body[path] === undefined)
            throw new BadRequest("Body variable undefined");

        const val = req.body[path];

        const capabilities = session.getCapabilitiesForRequest(req);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        capabilities.has("settings.set." + path).then(function (has) {
            if (has) {
                const pbp = path.split(".");
                let context = settings.settings;
                for (let i = 0; i < pbp.length - 1; i++) {
                    if (!context.hasOwnProperty(pbp[i])) {
                        const newcontext = {};
                        context[pbp[i]] = newcontext;
                        context = newcontext;
                        continue;
                    }
                    context = context[pbp[i]]
                }

                context[pbp[pbp.length - 1]] = val;

                res.status(200).send({})

            } else
                throw new Unauthorized("Not permitted to set settings path " + path);
        }).catch(err => next(err))
    });
    return router
};