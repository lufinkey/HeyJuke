const WebSocket = require("ws")

const commandDict = {
  "playSong": PlaySong
  // "playPlaylist": PlayPlaylist,
  // "playAlbum": PlayAlbum,
  // "stop": StopPlaying
}
const socket = new WebSocket('us://localhost:8086');

var audio = new Audio();

socket.addEventListener("open", (event) => socket.send('event connection opened'))

socket.addEventListener("message", (event) => consumeMessage(event))

function PlaySong(media, path){
  switch(media){
    case 'local':
      audio.src = path;
      audio.play();
      break;
    default:
      console.log('Invalid Media')
  }
}

function consumeMessage(event){
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