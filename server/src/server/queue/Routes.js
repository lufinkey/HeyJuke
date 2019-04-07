const router = require('express').Router();
const {BadRequest, Unauthorized} = require('../s15n/ApiError');
const QueueEntry = require('./QueueEntry');
const crypto = require('crypto')
function generateAuthToken() {
    return crypto.randomBytes(21).toString('base64')
}

module.exports = function (session, queue) {
    router.get('/', (req, res, next) => {
        const capabilities = session.getCapabilitiesForRequest(req);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        capabilities.has("queue.list").then(function (has) {
            if (has)
                res.status(200).send(queue.print());
            else
                throw new Unauthorized("Not permitted to perform queue list");
        }).catch(err => next(err))
    });

    router.post('/', (req, res, next) => {

        const payload = req.body;
        if (payload === undefined)
            throw new BadRequest("No put request");
        if (payload.uri === undefined)
            throw new BadRequest("No URI");
        if (payload.source === undefined)
            throw new BadRequest("No source");

        const token = req.headers["x-auth-token"];
        if (token === undefined)
            throw new Unauthorized("No token presented to add token to queue.");

        const capabilities = session.getCapabilitiesForAuthorization(token);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        capabilities.has("queue.put").then(function (has) {
            if (has) {
                const id = generateAuthToken();
                queue.addToQueue(new QueueEntry(token, payload.source, payload.uri, id));
                res.status(200).send({id})
            } else
                throw new Unauthorized("Not permitted to perform queue put");
        }).catch(err => next(err))

    });

    router.delete('/', (req, res, next) => {
        if (req.query["uid"] === undefined)
            throw new BadRequest("UID undefined");

        const token = req.headers["x-auth-token"];
        if (token === undefined)
            throw new Unauthorized("No token presented to administrate queue entries");

        const uid = req.query["uid"];
        const idx = queue.find(uid);
        if (idx === null)
            throw new BadRequest("Song does not exist in queue");


        const capabilities = session.getCapabilitiesForAuthorization(token);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        idx.item.canAdminstrate(token, capabilities).then(can => {
            if (can) {
                // then DO
                queue.remove(idx.index);
                res.status(200).send({})
            } else {
                throw new Unauthorized("Not permitted to administrate this entry")
            }
        }).catch(err => next(err))
    });

    router.post('/pause', (req, res, next) => {
        const capabilities = session.getCapabilitiesForRequest(req);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        capabilities.has("queue.pause").then(function (has) {
            if (has) {
                queue.pause();
            } else {
                throw new Unauthorized("Not permitted to pause the queue");
            }
        }).catch(err => next(err));
    });

    router.post('/play', (req, res, next) => {
        const capabilities = session.getCapabilitiesForRequest(req);

        if (capabilities === null)
            throw new BadRequest("Request contained an invalid X-Auth-Token");

        capabilities.has("queue.unpause").then(function (has) {
            if (has) {
                queue.unpause();
            } else {
                throw new Unauthorized("Not permitted to resume the queue");
            }
        }).catch(err => next(err));
    });

    return router
};
