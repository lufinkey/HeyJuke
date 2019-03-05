# Server subsystem

This directory holds information for the 'server' component. The server does the
following things:

+ Manage authentication and authorization
+ Manage system settings for the specific installation
+ Manage the user music queue
+ Interact with the MediaPlayer system for actually playing the media
+ Manage the local search cache

## Installation

The server component contains dependencies that need to be installed before the
server will run.

To install dependencies, you can run the following command in this directory:

```
npm install
```

This will install the required dependencies for HeyJuke's server.

## Running

HeyJuke's server can be run by executing the following command in the current
directory:

```
npm run start
```

This will start the HeyJuke server. At this point, you will be able to interact
with the server via the webapp. For full functionality, at this point the
MediaPlayer should also be started.

## Documentation

API specifications can be found within the [./server/docs/](docs) directory.
This includes a complimentary Insomnia configuration with all routes for
assistance in developing apps that interact with the HeyJuke server.
