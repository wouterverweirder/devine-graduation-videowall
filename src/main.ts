import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, screen } from 'electron';
import log from 'electron-log/main';
import started from 'electron-squirrel-startup';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getSpannedDisplayBounds } from './main/get-spanned-display-bounds';
import { processProjects } from './main/ipc';
import { goToNextProject, initializeView, init as initServer, sendKeyPressed } from './main/server';
import { ArgV, options } from './options';

log.initialize();

let yargsChain = yargs();

options.forEach(option => {
  yargsChain = yargsChain.option(option.name, option.value);
});
const argv:ArgV = yargsChain.parse(hideBin(process.argv)) as unknown as ArgV;
const isServerOnly = argv['only-server'];

const resolveAppPath = (app:Electron.App = undefined) => {
  let appPath = (app) ? path.resolve(app.getPath('exe'), '..') : process.cwd();
  const isMacOS = process.platform === 'darwin';
  const isMacOSAppBundle = isMacOS && app && app.isPackaged;
  if (isMacOSAppBundle) {
    // go up 3 levels to get to the folder containing the app bundle
    appPath = path.resolve(appPath, '../../../');
  } else if (isMacOS) {
    appPath = process.cwd();
  }
  return appPath;
};

const resolveProjectDirectory = (projectDirectory:string | undefined, app:Electron.App = undefined) => {
  const appPath = resolveAppPath(app);
  if (!projectDirectory) {
    return appPath;
  }
  const isAbsolute = path.isAbsolute(projectDirectory);
  if (!isAbsolute) {
    projectDirectory = path.resolve(appPath, projectDirectory);
  }
  return projectDirectory;
};

const startServer = async (argv:ArgV) => {
  console.log('devtools: ' + argv.devtools);
  console.log('editor: ' + argv.editor);
  console.log('only-server: ' + argv.onlyServer);
  console.log('projection: ' + argv.projection);
  console.log('projectDirectory: ' + argv.projectDirectory);

  await initServer(argv);
  initializeView();
};

ipcMain.handle('process-projects', async (_, projects: unknown, argv:ArgV) => {
  return await processProjects(projects, argv);
});

const selectDirectory = async ():Promise<string> => {
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      properties: ['openDirectory'],
    }).then((result) => {
      if (result.canceled) {
        reject(new Error('No directory selected'));
      } else {
        resolve(result.filePaths[0]);
      }
    }).catch(err => {
      reject(err);
    });
  });
};

const createWindows = () => {
  // convert the argv object to a querystring
  const querystring = Object.keys(argv).filter(key => argv[key] !== null).map(key => {
    return key + '=' + argv[key];
  }).join('&');

  const isSingleProjection = (argv.projection === 'single');
  const createMainWindow = true;
  const createControlPanel = argv.editor;

  const spannedDisplay = getSpannedDisplayBounds(screen);

  if (createMainWindow) {
    // Create the output window, make it span all displays
    const windowSettings:Electron.BrowserWindowConstructorOptions = {
      x: spannedDisplay.bounds.x,
      y: spannedDisplay.bounds.y,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false, // is default value after Electron v5
        contextIsolation: true, // protect against prototype pollution
        // enableRemoteModule: false, // turn off remote
        // preload: `http://127.0.0.1/frontend-preload.js`,
        preload: path.join(__dirname, 'preload.js'),
      }
    }

    if (!isSingleProjection) {
      windowSettings.enableLargerThanScreen = true;
      windowSettings.frame = false;
      windowSettings.roundedCorners = false;
      windowSettings.titleBarStyle = 'customButtonsOnHover';
      windowSettings.width = spannedDisplay.size.width;
      windowSettings.height = spannedDisplay.size.height;
    } else {
      // create a menu with an option to select the project directory
      const menu = [
        {
          label: 'File',
          submenu: [
            {
              label: 'Select Project Directory',
              click: async () => {
                try {
                  const selectedDirectory = await selectDirectory();
                  argv.projectDirectory = selectedDirectory;
                  console.log('Selected project directory:', selectedDirectory);
                  mainWindow.close();
                  startServer(argv);
                  createWindows();
                } catch (error) {
                  console.error('Error selecting directory:', error);
                }
              }
            },
            {
              label: 'Quit',
              click: () => {
                app.quit();
              }
            }
          ]
        }
      ];
      const menuTemplate = Menu.buildFromTemplate(menu);
      Menu.setApplicationMenu(menuTemplate);
    }

    const mainWindow = new BrowserWindow(windowSettings);
    mainWindow.setSize(windowSettings.width, windowSettings.height);

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/index.html?${querystring}`);
    } else {
      const filePath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
      const fileUrl = new URL(`file://${filePath}?${querystring}`).toString();
      mainWindow.loadURL(fileUrl);
    }

    const handleScreenChange = () => {
      mainWindow.close();
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
        // enableRemoteModule: false, // turn off remote
      }
    });
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      controlPanelWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/controlpanel.html?${querystring}`);
    } else {
      const filePath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/controlpanel.html`);
      const fileUrl = new URL(`file://${filePath}?${querystring}`).toString();
      controlPanelWindow.loadURL(fileUrl);
      // controlPanelWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/controlpanel.html?${querystring}`));
      // controlPanelWindow.loadURL(`http://127.0.0.1/controlpanel.html?${querystring}`);
    }
    if (argv.devtools) {
      controlPanelWindow.webContents.openDevTools()
    }
  }
}

if (!isServerOnly) {
  // Handle creating/removing shortcuts on Windows when installing/uninstalling.
  if (started) {
    app.quit();
  }

  app.whenReady().then(() => {
    argv.projectDirectory = resolveProjectDirectory(argv._[0], app);
    startServer(argv);
    createWindows()
    if (argv.websocket) {
      globalShortcut.register('Right', () => {
        sendKeyPressed({ key: 'right' });
        goToNextProject();
      });
    }
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindows();
    }
  });
} else {
  argv.projectDirectory = resolveProjectDirectory(argv._[0], app);
  startServer(argv);
}