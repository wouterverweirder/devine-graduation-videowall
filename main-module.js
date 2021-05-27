// Modules to control application life and create native browser window

import { app, BrowserWindow, screen, globalShortcut } from 'electron';
import path from 'path';

import { init, goToNextProject } from './server.js';

init();

const createMainWindow = true;
const createControlPanel = true;

function createWindows () {
  let displays = screen.getAllDisplays()

  // try to limit to 4K windows
  displays = displays.filter(o => o.bounds.height === 2160).sort();
  
  if (displays.length === 0) {
    // no 4K window? (eg developping locally) span over all displays
    displays = screen.getAllDisplays();
  }
  
  const spannedDisplay = displays.reduce((prev, curr) => ({ bounds: { x: Math.min(prev.bounds.x, curr.bounds.x), y: Math.min(prev.bounds.y, curr.bounds.y)}, size: { width: prev.size.width + curr.size.width, height: Math.max(prev.size.height, curr.size.height)}}), { size: { width: 0, height: 0 }, bounds: { x: Number.MAX_VALUE, y: Number.MAX_VALUE }});  

  console.log(spannedDisplay);

  if (createMainWindow) {
    // Create the output window, make it span all displays
    const mainWindow = new BrowserWindow({
      x: spannedDisplay.bounds.x,
      y: spannedDisplay.bounds.y,
      width: spannedDisplay.size.width,
      height: spannedDisplay.size.height,
      frame: false,
      titleBarStyle: 'customButtonsOnHover',
      webPreferences: {
        nodeIntegration: false, // is default value after Electron v5
        contextIsolation: true, // protect against prototype pollution
        enableRemoteModule: false, // turn off remote
        preload: path.join(__dirname, 'preload.js')
      }
    })

    mainWindow.setSize(spannedDisplay.size.width, spannedDisplay.size.height);

    // and load the index.html of the app.
    // mainWindow.loadFile('demo20-threejs-8-portrait.html')
    mainWindow.loadFile('public/main.html')

    // Open the DevTools.
    mainWindow.webContents.openDevTools()
  }

  if (createControlPanel) {
    const controlPanelWindow = new BrowserWindow({
      width: 1100,
      height: 600,
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  globalShortcut.register('Right', () => {
    goToNextProject();
  });

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