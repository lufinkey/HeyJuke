# HeyJuke Server Beacon

HeyJuke periodically sends a UDP broadcast beacon on port `42069` across the
broadcast interface. The UDP packet will contain the following structure:

```
{
    "version": 0,
    "host": "192.168.1.101",
    "port": 80,
    "name": "Server Name"
}
```

This packet will be broadcast every 3 seconds. Multiple broadcasts may be
received during a 3 second window for the same instance with different
hosts.This is due to the possibility that the beacon has determined that the
server is listening on multiple interfaces. Thus, it sends out a beacon for each
interface / ip. In this case, the `name` field will be the same across
broadcasts, and this is to be assumed to be the same instance.
