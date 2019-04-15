const BandcampAPI = require("bandcamp-api");
const YoutubeDL = require('ytdl-core');
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
  "continue": resume,
  "kill": kill
};

audio.onended = () => {
  status.status = "waiting"
  send(status);
}

function pauseAudio() {
  if (currentMedia == "audio")
    audio.pause();
  else if (currentMedia == "youtube")
    ytplayer.pauseVideo();
  else if (currentMedia == "spotify")
    window.spotifyplayer.pause();
}

// websocket stuff
var socket = new WebSocket('ws://localhost:8086');

var connectAttempts = 0
socket.onerror = () => {
  console.log("error " + connectAttempts);
}

socket.onopen = () => send(status)

// youtube

let ytplayer;
function onYouTubeIframeAPIReady() {
  ytplayer = new YT.Player('ytplayer', {
    height: '300',
    width: '300',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

function onPlayerStateChange(event) {
  if (event.data == 0 || event.data == -1) {
    status.status = "waiting";
    send(status);
  }
}

// spotify
const playSpotify = ({
  spotify_uri,
  playerInstance: {
    _options: {
      getOAuthToken,
      id
    }
  }
}) => {
  getOAuthToken(access_token => {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [spotify_uri] }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
    });
  });
};

// playing api stuff

async function playSong(args) {
  stop(args);
  switch (args["source"]) {
    case 'local':
      currentMedia = "audio"
      audio.src = args["uri"];
      audio.play();
      status.status = "started"
      break;
    case 'bandcamp':
      currentMedia = "audio"
      const result = await bandcamp.getItemFromURL(args["uri"]);
      console.log(result);
      audio.src = result.audioURL;
      audio.play();
      status.status = "started"
      break;
    case 'youtube':
      currentMedia = args["source"];
      const uri = args["uri"];
      console.log("Youtube uri ", uri);
      const uriParts = uri.split(':');
      if(uriParts[0] !== 'youtube') {
        throw new Error("Invalid youtube URI");
      }
      else if(uriParts[1] !== 'video') {
        throw new Error("Youtube URI is not a video uri");
      }
      const id = uriParts[2];
      if(!id) {
        throw new Error("URI missing video id component");
      }
      const url = `https://www.youtube.com/watch?v=${id}`;
      const info = await new Promise((resolve, reject) => {
        YoutubeDL.getInfo(url, (error, info) => {
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        });
      });
      const audioFormat = YoutubeDL.chooseFormat(info.formats, {format: 'mp3'});
      audio.src = audioFormat.url;
      audio.play();
      status.status = "started"
      break;
    case 'spotify':
      currentMedia = args["source"];
      playSpotify({
        playerInstance: window.spotifyplayer,
        spotify_uri: 'spotify:track:3Pt8XN6zWFmW2ShLna8Ttb'
      });
      status.status = "started"
      break;
    default:
      console.log('Invalid Source');
      status.status = "waiting";
  }
}

async function stop(args) {
  pauseAudio();
  status.status = "paused"
}

async function resume(args) {
  if (currentMedia == "audio")
    audio.play();
  else if (currentMedia == "youtube")
    ytplayer.playVideo();
  else if (currentMedia == "spotify")
    window.player.resume();
  status.status = "resumed"
}

async function kill(args) {
  window.close();
  status.domain = "player";
  status.status = "killed";
}

socket.onmessage = async (event) => {
  var args = JSON.parse(event.data);
  console.log("< " + event.data)
  await commandDict[args["command"]](args);
  send(status);
}

function send(obj) {
  var str = JSON.stringify(obj)
  console.log("> " + str);
  socket.send(str);
}