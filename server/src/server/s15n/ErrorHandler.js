const process = require('process');
const http = require('http');
const {NotFound} = require('./ApiError');

const propGen = function () {
    if (process.env.NODE_ENV === "production") {
        return function (error) {
            return error.prodData || {}
        }
    } else {
        return function (error) {
            let a = {};
            Object.assign(a, error.prodData);
            return Object.assign(a, error.devData)
        }
    }
}();

const internalDecorator = function() {
    if (process.env.NODE_ENV === "production") {
        return function(response, error) {
            return response
        }
    } else {
        return function(response, error) {
            response.data = error;
            return response
        }
    }
}();

function isEmpty(o) {
    for (const _ in o) return false;
    return true;
}

module.exports = [
    function (req, res, next) {
        next(new NotFound(`Route ${req.method}:${req.path} does not exist`));
    },
    function (err, req, res, next) {
        if (err.hasOwnProperty("errorCode") && err.hasOwnProperty("message")) {
            let responseObject = {
                errorCode: err.errorCode,
                error: http.STATUS_CODES[err.errorCode],
                message: err.message
            };

            const props = propGen(err);

            if (!isEmpty(props))
                responseObject["data"] = props;

            res.status(err.errorCode).send(responseObject);
            return
        }
        next(err)
    },
    function(err, req, res, next) {
        res.status(500).send(internalDecorator({
            errorCode: 500,
            error: http.STATUS_CODES[500],
            message: "An internal error occurred."
        }, err));
        console.log(err);
    }
];