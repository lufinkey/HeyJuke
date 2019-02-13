const WebSocket = require("ws")

const commandDict = {
  "playSong": PlaySong
  // "playPlaylist": PlayPlaylist,
  // "playAlbum": PlayAlbum,
  // "stop": StopPlaying
}
const socket = new WebSocket('us://localhost:8086')

socket.addEventListener("open", (event) => socket.send('event connection opened'))

socket.addEventListener("message", (event) => consumeMessage(event))

function PlaySong(media, path){
  switch(media){
    case 'local':
      player = document.getElementById('local-player')
      player.setAttribute("src", path)
      socket.send('event playback started ' + path)
      break;
    default:
      socket.send('Invalid Media')
  }
}

function consumeMessage(event){
  var args = event.data.split(" ")
  switch(args[0]){
    case 'command':
      commandDict[args[1]](args[2],args[3]);
      break;
    case 'event':
      break;
    default:
      socket.send('Invalid Message')
  }
}