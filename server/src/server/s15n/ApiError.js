class StandardError {
    constructor(errorCode, message, prodData={}, devData={}) {
        this.errorCode = errorCode;
        this.message = message;
        this.prodData = prodData;
        this.devData = devData;
    }
}

class InternalServerError extends StandardError {
    constructor(message, prodData={}, devData={}) {
        super(500, message, prodData, devData);
    }
}

class BadRequest extends StandardError {
    constructor(message, prodData={}, devData={}) {
        super(400, message, prodData, devData);
    }
}

class Unauthorized extends StandardError {
    constructor(message, prodData={}, devData={}) {
        super(401, message, prodData, devData)
    }
}

class NotFound extends StandardError {
    constructor(message, prodData={}, devData={}) {
        super(404, message, prodData, devData);
    }
}

module.exports = {
    StandardError,
    BadRequest,
    Unauthorized,
    NotFound,
    InternalServerError
};