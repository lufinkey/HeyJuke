const WebSocket = require("ws")
const BandcampAPI = require("bandcamp-api")
var audio = new Audio();
var bandcamp = new BandcampAPI();

const commandDict = {
  "play-song": playSong,
  // "playPlaylist": PlayPlaylist,
  // "playAlbum": PlayAlbum,
  "stop": stop,
  "continue": resume
}

var socket = new WebSocket('us://localhost:8086');

var connectAttempts = 0

socket.onerror = () => {
  console.log("error " + connectAttempts);
}

socket.onopen = () => socket.send('event connection opened')

async function playSong(args){
  switch(args["media"]){
    case 'local':
      audio.src = args["uri"];
      audio.play();
      socket.send("playback started");
      break;
    case 'bandcamp':
      console.log(args)
      const result = await bandcamp.getItemFromURL(args["uri"]);
      console.log(result);
      audio.src = result.audioURL;
      audio.play();
      socket.send("playback started");
      break;
    default:
      console.log('Invalid Media')
  }
}

async function stop(args){
  audio.pause();
  socket.send("playback paused")
}

async function resume(args){
  audio.play();
  socket.send("playback resumed")
}

socket.onmessage = (event) => {
  var args = JSON.parse(event.data)
  commandDict[args["command"]](args);
}