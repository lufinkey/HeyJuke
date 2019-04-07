const router = require('express').Router();
const {BadRequest, Unauthorized, InternalServerError, StandardError} = require('../s15n/ApiError');

module.exports = function (session, settings, spotify) {
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
        if (req.body === undefined)
            throw new BadRequest("Body undefined");

        const capabilities = session.getCapabilitiesForRequest(req);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        const promises = [];

        for (const path in req.body) {
            if (!req.body.hasOwnProperty(path))
                continue;

            promises.push(capabilities.has("settings.set." + path).then(has => {
                if (!has)
                    throw new Unauthorized("Not permitted to set settings path " + path);
            }))
        }

        Promise.all(promises).then(() => {
                for (const path in req.body) {
                    if (!req.body.hasOwnProperty(path))
                        continue;

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
                }
            }
        ).then(() => {
            res.status(200).send({})
        }).catch(err => next(err));
    });

    router.post('/spotify/swap', async (req, res, next) => {
        try {
            const capabilities = session.getCapabilitiesForRequest(req);

            if (capabilities === null)
                return next(new BadRequest("Request contained an invalid X-Auth-Token"));

            const can = await capabilities.has("settings.spotify");
            if (!can)
                return next(new Unauthorized("Unauthorized to administrate Spotify settings"));

            const result = await spotify.swap(req.body.code);

            // send response
            res.status(response.statusCode).json(result);
        } catch (error) {
            if (error.response) {
                next(new StandardError(error.response.statusCode, "Spotify authentication did not return cleanly", error.data));
            } else {
                next(new InternalServerError("Spotify authentication did not return cleanly.", error.data))
            }
        }
    });

    return router
};
