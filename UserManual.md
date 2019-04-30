# HeyJuke

HeyJuke is a party Jukebox - with HeyJuke, mutiple people are able to queue up
songs from a variety of sources and have them played from a common source.

### Installation

HeyJuke requires some installation steps to start an instance.

#### Prerequisites

Both the server and the media player require a valid Node.js (with npm)
installation. Consult your operating system's documentation for information on
how to install Node.

#### Steps

To install HeyJuke, you can run the following commands:

```bash
git clone https://github.com/lufinkey/HeyJuke.git ~/heyjuke
cd ~/heyjuke/server
npm install
cd ~/heyjuke/mediaplayer
npm install
```

This will pull down the current HeyJuke source code then install the required
package dependencies.

### Running

HeyJuke can be run by first starting the server, then starting the mediaplayer.

```bash
cd ~/heyjuke/server
npm run start &
cd ~/heyjuke/mediaplayer
npm run start &
```

This will start both components in the correct order. You can also use a
terminal multiplexer such as tmux to run both instances.

### Subsection Documentation

Some subsection specific documentation is located here:

+ [Mobile App](./app)

+ [MediaPlayer](./mediaplayer)

+ [Server](./server)
