const WebSocket = require("ws")
const BandcampAPI = require("bandcamp-api")
var audio = new Audio();
var bandcamp = new BandcampAPI();
var currentMedia = "audio";

const commandDict = {
  "play-song": playSong,
  "stop": stop,
  "continue": resume
}

audio.onended = () => send("playback ended");

// websocket stuff

var socket = new WebSocket('us://localhost:8086');

var connectAttempts = 0
socket.onerror = () => {
  console.log("error " + connectAttempts);
}

socket.onopen = () => send('event connection opened')

// youtube

var ytplayer;
function onYouTubeIframeAPIReady() {
  ytplayer = new YT.Player('player', {
    height: '100',
    width: '100',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT && !done) {
    setTimeout(stopVideo, 6000);
    done = true;
  }
}
function stopVideo() {
  player.stopVideo();
}

// playing api stuff

async function playSong(args){
  switch(args["media"]){
    case 'local':
      currentMedia = "audio"
      audio.src = args["uri"];
      audio.play();
      send("playback started");
      break;
    case 'bandcamp':
      currentMedia = "audio"
      console.log(args)
      const result = await bandcamp.getItemFromURL(args["uri"]);
      console.log(result);
      audio.src = result.audioURL;
      audio.play();
      send("playback started");
      break;
    case 'youtube':
      currentMedia = args["media"];
      ytplayer.loadVideoById(args["uri"], 0, "small")
      ytplayer.playVideo();
      send("playback started");
      break;
    default:
      console.log('Invalid Media')
  }
}

async function stop(args){
  if(currentMedia == "audio")
    audio.pause();
  else if (currentMedia == "youtube")
    ytplayer.pauseVideo();
  send("playback paused")
}

async function resume(args){
  if(currentMedia == "audio")
    audio.play();
  else if (currentMedia == "youtube")
    ytplayer.playVideo();
  send("playback resumed")
}

socket.onmessage = (event) => {
  var args = JSON.parse(event.data);
  console.log("< " + event.data)
  commandDict[args["command"]](args);
}

function send(str) {
  socket.send(str);
  console.log("> " + str);
}