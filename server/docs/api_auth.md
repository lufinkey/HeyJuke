# /auth

This document covers the authentication server api routes.

## GET /auth

Returns a list of supported authentication mechanisms.

Capability: none

#### Response
```
{
  "methods": [
    "password"
  ]
}
```

## POST /auth/login

Receives a new authorization token via a given authentication mechanism.

Capability: none

#### Request

Contains the method to use when authenticating. Additional payload options for this request depend on the method chosen:

+ password - "password" should be filled with an unhashed password from the client.

```
{
  "method": "password",
  "password": "test"
}
```

#### Response

On success, this will return the token. Future requests should include this token in the `X-Auth-Token` header.

```
{
  "token": "/vErfxYF4Z1ztD/j4nIHoGwNZyvt"
}
```

## POST /auth/logout

Makes a server forget about an authorization token.

Capability: none

#### Request

None. Client MUST have a X-Auth-Token header sent with the request.

#### Response

On success, an empty response is sent.

```
{}
```
