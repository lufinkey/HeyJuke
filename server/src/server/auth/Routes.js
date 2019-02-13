const router = require('express').Router();
const {BadRequest} = require('../s15n/ApiError');

module.exports = function(auth, session) {
    router.get('/', function(req, res, next) {
        res.json({
            methods: auth.getMethods()
        })
    });

    router.post('/login', function (req, res, next) {
        const payload = req.body;

        auth.authenticateFor(payload)
            .then(capabilities => {
                const token = session.createAuthorizationToken(capabilities);
                res.json({
                    token
                })
            })
            .catch(err => next(err))
    });

    router.post('/logout', function (req, res) {
        const token = req.headers["x-auth-token"];
        if (token === undefined)
            throw new BadRequest("Request did not include a X-Auth-Token");

        if (session.invalidateAuthorization(token))
            res.json({});
        else
            throw new BadRequest("X-Auth-Token invalid");
    });

    return router
};
