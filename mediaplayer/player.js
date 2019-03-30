const WebSocket = require("ws")
var audio = new Audio();

const commandDict = {
  "play-song": PlaySong,
  // "playPlaylist": PlayPlaylist,
  // "playAlbum": PlayAlbum,
  "stop": audio.pause,
  "continue": audio.play
}

var socket = new WebSocket('us://localhost:8086');

var connectAttempts = 0

socket.onerror = () => {
  console.log("error " + connectAttempts);
}

socket.onopen = () => socket.send('event connection opened')

function PlaySong(args){
  switch(args["media"]){
    case 'local':
      audio.src = args["uri"];
      audio.play();
      socket.send("playback started");
      break;
    default:
      console.log('Invalid Media')
  }
}

socket.onmessage = (event) => {
  var args = JSON.parse(event.data)
  commandDict[args[command]](args);
}