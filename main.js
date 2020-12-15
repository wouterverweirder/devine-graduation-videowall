// Modules to control application life and create native browser window
const {app, BrowserWindow, screen} = require('electron')
const path = require('path')

function createWindow () {
  let displays = screen.getAllDisplays()

  // only keep 4K windows
  displays = displays.filter(o => o.bounds.height === 2160).sort();

  console.log(displays);
  
  const spannedDisplay = displays.reduce((prev, curr) => ({ bounds: { x: Math.min(prev.bounds.x, curr.bounds.x), y: Math.min(prev.bounds.y, curr.bounds.y)}, size: { width: prev.size.width + curr.size.width, height: Math.max(prev.size.height, curr.size.height)}}), { size: { width: 0, height: 0 }, bounds: { x: Number.MAX_VALUE, y: Number.MAX_VALUE }});  

  console.log(spannedDisplay);

  // Create the window, make it span all displays
  const mainWindow = new BrowserWindow({
    x: spannedDisplay.bounds.x,
    y: spannedDisplay.bounds.y,
    width: spannedDisplay.size.width,
    height: spannedDisplay.size.height,
    frame: false,
    titleBarStyle: 'customButtonsOnHover',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.setSize(spannedDisplay.size.width, spannedDisplay.size.height);

  // and load the index.html of the app.
  // mainWindow.loadFile('demo20-threejs-8-portrait.html')
  mainWindow.loadFile('demo21-threejs-8-combo.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
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
