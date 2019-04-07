const WebSocket = require("ws")
const BandcampAPI = require("bandcamp-api")
let audio = new Audio();
let bandcamp = new BandcampAPI();
let currentMedia = "audio";

let status = {
  domain: "playback",
  status: "waiting"
};

const commandDict = {
  "play-song": playSong,
  "stop": stop,
  "continue": resume
};

audio.onended = () => {
  status.status = "waiting"
  send(status);
}

// websocket stuff

var socket = new WebSocket('us://localhost:8086');

var connectAttempts = 0
socket.onerror = () => {
  console.log("error " + connectAttempts);
}

socket.onopen = () => send(status)

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
  if (event.data == 0 && !done) {
    status.status = "waiting";
    send(status);
  }
}

// playing api stuff

async function playSong(args){
  switch(args["media"]){
    case 'local':
      currentMedia = "audio"
      audio.src = args["uri"];
      audio.play();
      status.status = "started"
      send(status);
      break;
    case 'bandcamp':
      currentMedia = "audio"
      console.log(args)
      const result = await bandcamp.getItemFromURL(args["uri"]);
      console.log(result);
      audio.src = result.audioURL;
      audio.play();
      status.status = "started"
      send(status);
      break;
    case 'youtube':
      currentMedia = args["media"];
      ytplayer.loadVideoByUrl(args["uri"], 0, "small")
      ytplayer.playVideo();
      status.status = "started"
      send(status);
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
  status.status = "paused"
  send(status);
}

async function resume(args){
  if(currentMedia == "audio")
    audio.play();
  else if (currentMedia == "youtube")
    ytplayer.playVideo();
  status.status = "resumed"
  send(status);
}

socket.onmessage = (event) => {
  var args = JSON.parse(event.data);
  console.log("< " + event.data)
  commandDict[args["command"]](args);
}

function send(obj) {
  var str = JSON.stringify(obj)
  console.log("> " + str);
  socket.send(str);
}