# /settings

This document describes the settings object, a basic KV store for
configuration based information.

## GET /settings?path=test

Capability: settings.get.<path>

#### Request

The path query is a dot seperated query path.

#### Response

The resulting settings, if they exist. Otherwise, empty object.

```
"test": "Hello!"
```

## POST /settings?path=test

Capability: settings.set.<path>

#### Request

The path query is a dot seperated query path. Also an object to
set the path to as the body with the path as the argument:

```json
{
  "test": "hello"
}
```

#### Response

The resulting settings, if they exist. Otherwise, empty object.

```
"test": "Hello!"
```
