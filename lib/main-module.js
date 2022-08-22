// Modules to control application life and create native browser window

import yargs from 'yargs';
import path from 'path';

import { init as initServer, goToNextProject, sendKeyPressed } from './server.js';

const argv = yargs
.option('devtools', {
  description: 'Open devtools',
  type: 'boolean',
  default: false
})
.option('editor', {
  description: 'Open editor',
  type: 'boolean',
  default: false
})
.option('only-server', {
  description: 'Run server only',
  type: 'boolean',
  default: false
})
.option('projection', {
  description: 'Choose a projection mode',
  choices: ['multi', 'single'],
  default: 'single'
})
.option('websocket', {
  description: 'Controllable through websocket',
  type: 'boolean',
  default: false
})
.option('server-url', {
  description: 'URL of the API server',
  type: 'string',
  default: false
})
.argv;

console.log('devtools: ' + argv.devtools);
console.log('editor: ' + argv.editor);
console.log('only-server: ' + argv.onlyServer);
console.log('projection: ' + argv.projection);

// convert the argv object to a querystring
const querystring = Object.keys(argv).map(key => {
  return key + '=' + argv[key];
}).join('&');

const isSingleProjection = (argv.projection === 'single');
const isServerOnly = argv.onlyServer;

initServer(argv);

if (!isServerOnly) {
  import('electron').then(({ app, BrowserWindow, screen, globalShortcut }) => {
    if (!app) {
      console.log('app is undefined');
      return;
    }
    const createMainWindow = true;
    const createControlPanel = argv.editor;

    function createWindows () {
      if (isServerOnly) {
        return;
      }
      let displays = screen.getAllDisplays()

      // try to limit to 4K windows
      displays = displays.filter(o => o.bounds.height === 2160).sort();
      
      if (displays.length === 0) {
        // no 4K window? (eg developping locally) span over all displays
        displays = screen.getAllDisplays().sort((a, b) => (a.bounds.width > b.size.width) ? -1 : 1);
      }
      
      const spannedDisplay = displays.reduce((prev, curr) => ({ bounds: { x: Math.min(prev.bounds.x, curr.bounds.x), y: Math.min(prev.bounds.y, curr.bounds.y)}, size: { width: prev.size.width + curr.size.width, height: Math.max(prev.size.height, curr.size.height)}}), { size: { width: 0, height: 0 }, bounds: { x: Number.MAX_VALUE, y: Number.MAX_VALUE }});  

      console.log(spannedDisplay);

      if (createMainWindow) {
        // Create the output window, make it span all displays
        const windowSettings = {
          x: spannedDisplay.bounds.x,
          y: spannedDisplay.bounds.y,
          width: spannedDisplay.size.width,
          height: spannedDisplay.size.height,
          webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, '..', 'src', 'frontend-preload.js'),
          }
        }
        if (!isSingleProjection) {
          windowSettings.enableLargerThanScreen = true;
          windowSettings.frame = false;
          windowSettings.roundedCorners = false;
          windowSettings.titleBarStyle = 'customButtonsOnHover';
        }
        const mainWindow = new BrowserWindow(windowSettings);

        mainWindow.setSize(windowSettings.width, windowSettings.height);

        // and load the index.html of the app.
        mainWindow.loadURL(`http://127.0.0.1/index.html?${querystring}`);

        if (argv.devtools) {
          mainWindow.webContents.openDevTools()
        }

        if (!isSingleProjection) {
          mainWindow.once('ready-to-show', () => {
            mainWindow.setAlwaysOnTop(true, "normal");
            mainWindow.focus();
          });
        }
      }

      if (createControlPanel) {
        const controlPanelWindow = new BrowserWindow({
          width: 1100,
          height: 600,
          webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
          }
        });
        controlPanelWindow.loadURL(`http://127.0.0.1/controlpanel.html?${querystring}`);
        if (argv.devtools) {
          controlPanelWindow.webContents.openDevTools()
        }
      }
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(() => {
      if (argv.websocket !== false) {
        globalShortcut.register('Right', () => {
          sendKeyPressed({ key: 'right' });
          goToNextProject();
        });
      }

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
  }).catch(err => console.log(err));
}