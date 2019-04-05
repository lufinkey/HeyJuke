# /queue

This document covers the queue management system. 

## GET /queue

Returns the current list of the songs in the queue along with their entry owner
if applicable.

Capability: queue.list

#### Response
```
{
    "queue": [
        {
            "uri": "file://xyz",
            "owner": "<token>"
        },
        ...
    ]
}
```

Next song to be played will be at the front of the queue.

## POST /queue

Puts a new item on the queue.

Capability: queue.put

#### Request
```
{
    "uri": "file:///test"
}
```

## DELETE /queue?uri=file%3A%2F%2F%2Ftest

Removes an item from the queue.

Capability: Either token sent created the item, or queue.delete

#### Response

200 if exists, 404 if does not exist. 403 if permissions are missing.
