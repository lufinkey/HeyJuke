const { app, BrowserWindow } = require('electron')
const WebSocket = require("ws")

// const commandDict = {
//   "playSong": PlaySong,
//   "playPlaylist": PlayPlaylist,
//   "playAlbum": PlayAlbum,
//   "stop": StopPlaying
// }

const socket = new WebSocket('us://localhost:8086')

let win

function createWindow () {
  win = new BrowserWindow({ width: 800, height: 600 })

  win.loadFile('index.html')

  win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

socket.addEventListener("open", (event) => socket.send('Connection opened'))

socket.addEventListener('message', (event) => consumeMessage(event))

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
})

function consumeMessage(event){
  var args = JSON.parse(event.data)
  switch(args[0]){
    case 'command':
      commandDict[args[1]](args.slice(start=2));
      break;
    case 'event':
      break;
    default:
      Console.log('Invalid Message')
  }
}

