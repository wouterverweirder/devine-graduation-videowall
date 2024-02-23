// Modules to control application life and create native browser window

import path from 'path';
import yargs from 'yargs';

import { options } from '../options';
import { goToNextProject, init as initServer, sendKeyPressed } from './server.js';

const log = require('electron-log');
Object.assign(console, log.functions);

let argv = yargs;
options.forEach(option => {
  argv = argv.option(option.name, option.value);
});
argv = argv.argv;
const isServerOnly = argv.onlyServer;

const startServer = (app = undefined) => {
  let appPath = (app) ? path.resolve(app.getPath('exe'), '..') : process.cwd();
  const isMacOS = process.platform === 'darwin';
  const isMacOSAppBundle = isMacOS && app && app.isPackaged;
  if (isMacOSAppBundle) {
    // go up 4 levels to get to the folder containing the app bundle
    appPath = path.resolve(appPath, '../../../../');
  } else if (isMacOS) {
    appPath = process.cwd();
  }
  console.log('appPath: ' + appPath)

  const hasProjectDirectoryAsArgument = argv._.length > 0;
  if (hasProjectDirectoryAsArgument) {
    let projectDirectory = argv._[0];
    const isAbsolute = path.isAbsolute(projectDirectory);
    if (!isAbsolute) {
      projectDirectory = path.resolve(appPath, projectDirectory);
    }
    argv.projectDirectory = projectDirectory;
  } else {
    argv.projectDirectory = appPath;
  }

  console.log('devtools: ' + argv.devtools);
  console.log('editor: ' + argv.editor);
  console.log('only-server: ' + argv.onlyServer);
  console.log('projection: ' + argv.projection);
  console.log('projectDirectory: ' + argv.projectDirectory);

  initServer(argv);
};

const getSpannedDisplayBounds = (screen) => {
  let displays = screen.getAllDisplays()

  // try to limit to 4K windows
  displays = displays.filter(o => o.bounds.height === 2160).sort();
  
  if (displays.length === 0) {
    // no 4K window? (eg developping locally) span over all displays
    displays = screen.getAllDisplays().sort((a, b) => (a.bounds.width > b.size.width) ? -1 : 1);
  }
  
  const spannedDisplay = displays.reduce((prev, curr) => ({ bounds: { x: Math.min(prev.bounds.x, curr.bounds.x), y: Math.min(prev.bounds.y, curr.bounds.y)}, size: { width: prev.size.width + curr.size.width, height: Math.max(prev.size.height, curr.size.height)}}), { size: { width: 0, height: 0 }, bounds: { x: Number.MAX_VALUE, y: Number.MAX_VALUE }});

  return spannedDisplay;
};

if (!isServerOnly) {
  import('electron').then(({ app, BrowserWindow, screen, globalShortcut }) => {
    if (!app) {
      console.log('app is undefined');
      return;
    }
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    if (require('electron-squirrel-startup')) {
      app.quit();
    }

    // start the server
    startServer(app);

    // convert the argv object to a querystring
    const querystring = Object.keys(argv).map(key => {
      return key + '=' + argv[key];
    }).join('&');

    const isSingleProjection = (argv.projection === 'single');
    const createMainWindow = true;
    const createControlPanel = argv.editor;

    function createWindows () {
      if (isServerOnly) {
        return;
      }
      
      const spannedDisplay = getSpannedDisplayBounds(screen);

      if (createMainWindow) {
        // Create the output window, make it span all displays
        const windowSettings = {
          x: spannedDisplay.bounds.x,
          y: spannedDisplay.bounds.y,
          width: 800,
          height: 600,
          webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: `http://127.0.0.1/frontend-preload.js`,
          }
        }
        if (!isSingleProjection) {
          windowSettings.enableLargerThanScreen = true;
          windowSettings.frame = false;
          windowSettings.roundedCorners = false;
          windowSettings.titleBarStyle = 'customButtonsOnHover';
          windowSettings.width = spannedDisplay.size.width;
          windowSettings.height = spannedDisplay.size.height;
        }
        const mainWindow = new BrowserWindow(windowSettings);

        mainWindow.setSize(windowSettings.width, windowSettings.height);

        // and load the index.html of the app.
        mainWindow.loadURL(`http://127.0.0.1/index.html?${querystring}`);

        const handleScreenChange = (e) => {
          // close the windows
          mainWindow.close();
          // open the window again
          createWindows();
        };

        if (argv.devtools) {
          mainWindow.webContents.openDevTools()
        }

        if (!isSingleProjection) {
          mainWindow.once('ready-to-show', () => {
            mainWindow.setAlwaysOnTop(true, "normal");
            mainWindow.focus();
          });

          screen.on('display-metrics-changed', handleScreenChange);

          mainWindow.on('closed', () => {
            screen.removeListener('display-metrics-changed', handleScreenChange);
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
} else {
  startServer();
}