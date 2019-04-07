const { app, BrowserWindow } = require('electron');
let win;
let wv = false;

function createWindow () {
  win = new BrowserWindow({ 
    width: 1000, 
    height: 800, 
    webPreferences: {
      plugins: true
    },
    nodeIntegration: true
  });

  win.loadFile('index.html');
  

  win.webContents.openDevTools();

  win.on('closed', () => {
    win = null;
  });
}

app.on("widevine-ready", (version, lastVersion) => console.log(wv));

app.on('ready', createWindow);

app.commandLine.appendSwitch('--autoplay-policy','no-user-gesture-required');

// You have to pass the directory that contains widevine library here, it is
// * `libwidevinecdm.dylib` on macOS,
// * `widevinecdm.dll` on Windows.
app.commandLine.appendSwitch('widevine-cdm-path', './libwidevinecdm.so')
// The version of plugin can be got from `chrome://plugins` page in Chrome.
app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.866')

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});


