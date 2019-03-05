const WebSocket = require("ws")
var audio = new Audio();

const commandDict = {
  "play-song": PlaySong,
  // "playPlaylist": PlayPlaylist,
  // "playAlbum": PlayAlbum,
  "stop": audio.pause,
  "continue": audio.play
}
const socket = new WebSocket('us://localhost:8086');


socket.onopen = () => socket.send('event connection opened')

function PlaySong(media, path){
  switch(media){
    case 'local':
      audio.src = path;
      audio.play();
      socket.send("playback started");
      break;
    default:
      console.log('Invalid Media')
  }
}

socket.onmessage = (event) => {
  var args = JSON.parse(event.data)
  switch(args[0]){
    case 'command':
      commandDict[args[1]](args[2],args[3]);
      break;
    case 'event':
      break;
    default:
      console.log('Invalid Message')
  }
}