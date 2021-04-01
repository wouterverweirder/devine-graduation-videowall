// Modules to control application life and create native browser window
const {app, BrowserWindow, screen, ipcMain} = require('electron')
const path = require('path')
const fs = require('fs')

const express = require('express');
const expressApp = express();
const WebSocketServer = require('websocket').server;
const http = require('http');
const server = http.Server(app);
const port = process.env.PORT || 80;

const wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

wsServer.on('request', function(request) {
  const connection = request.accept();
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      wsServer.broadcastUTF(message.utf8Data);
      try {
        const parsed = JSON.parse(message.utf8Data);
        console.log(parsed);
      } catch (e) {
      }
    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      wsServer.broadcastBytes(message.binaryData);
    }
  });

  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});

expressApp.use(express.static('public'));
server.listen(port, () => {
 console.log(`App listening on port ${port}!`);
});

function createWindows () {
  let displays = screen.getAllDisplays()

  // only keep 4K windows
  displays = displays.filter(o => o.bounds.height === 2160).sort();

  console.log(displays);
  
  const spannedDisplay = displays.reduce((prev, curr) => ({ bounds: { x: Math.min(prev.bounds.x, curr.bounds.x), y: Math.min(prev.bounds.y, curr.bounds.y)}, size: { width: prev.size.width + curr.size.width, height: Math.max(prev.size.height, curr.size.height)}}), { size: { width: 0, height: 0 }, bounds: { x: Number.MAX_VALUE, y: Number.MAX_VALUE }});  

  console.log(spannedDisplay);

  // // Create the output window, make it span all displays
  // const mainWindow = new BrowserWindow({
  //   x: spannedDisplay.bounds.x,
  //   y: spannedDisplay.bounds.y,
  //   width: spannedDisplay.size.width,
  //   height: spannedDisplay.size.height,
  //   frame: false,
  //   titleBarStyle: 'customButtonsOnHover',
  //   webPreferences: {
  //     nodeIntegration: false, // is default value after Electron v5
  //     contextIsolation: true, // protect against prototype pollution
  //     enableRemoteModule: false, // turn off remote
  //     preload: path.join(__dirname, 'preload.js')
  //   }
  // })

  // mainWindow.setSize(spannedDisplay.size.width, spannedDisplay.size.height);

  // // and load the index.html of the app.
  // // mainWindow.loadFile('demo20-threejs-8-portrait.html')
  // mainWindow.loadFile('public/main.html')

  // // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  const controlPanelWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, 'preload.js')
    }
  });
  controlPanelWindow.loadFile('public/controlpanel.html');
  controlPanelWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindows()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindows()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on("toMain", (event, args) => {
  if (args.type === 'saveConfigs') {
    fs.writeFileSync('public/config.json', JSON.stringify(args.json, null, 2));
  }
  console.log(args);
  // fs.readFile("path/to/file", (error, data) => {
  //   // Do something with file contents

  //   // Send result back to renderer process
  //   win.webContents.send("fromMain", responseObj);
  // });
});