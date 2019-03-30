# Media Player usage
1. Have the Server running, or at least some websocket server on port 8086 on a machine
2. From this folder, run npm start to launch the Electron app
3. Communicate to Electron from the Server

```
{"command": "play-song", "source":[media], "uri":[path]}
```
Start the song at the specified path from the specified medium. Available media options are: 
```local``` where the uri is a file path to a audio file on the local machine,
```spotify``` where the uri is a Spotify UID,
```youtube``` where the uri is a YouTube URL, and
```bandcamp``` where the uri is a BandCamp URL.

```
{"command": "stop"}
```
Stops whatever is currently playing.

```
{"command": "continue"}
```
Resumes or restarts playback of current song.
