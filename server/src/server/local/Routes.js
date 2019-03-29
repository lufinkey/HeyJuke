const router = require('express').Router();
const {BadRequest, Unauthorized} = require('../s15n/ApiError');

module.exports = function (session, local) {
    router.get('/search', function (req, res, next) {
        const query = req.query.query;
        if (query === undefined)
            throw new BadRequest("Request did not include a query");

        const capabilities = session.getCapabilitiesForRequest(req);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        capabilities.has("localSearch").then(
            has => {
                if (!has)
                    throw new Unauthorized("Not permitted to perform local search");

                res.json({
                    songs: local.query(query)
                })
            }
        ).catch(err => next(err));
    });

    return router;
};