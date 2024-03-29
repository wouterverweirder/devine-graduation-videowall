import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import util from 'util';
import { server as WebSocketServer } from 'websocket';
import { requestKeyPressed, requestShowProject, requestShowProjectsOverview } from '../js/classes/ServerConnection.js';
import dgram from 'dgram';
import { SerialPort } from 'serialport';
import shutDownWin from './node-shutdown-windows.js';
import { getValueByPath } from '../js/functions/getValueByPath.js';

const readFilePromised = util.promisify(fs.readFile);
const readDirPromised = util.promisify(fs.readdir);
const statPromised = util.promisify(fs.stat);

const isWindows = process.platform === "win32";

let htmlFolderPath;
let srcFolderPath;
let projectDirectory;
let configJSONPath;

let expressApp, server, port, wsServer;
let extendedConnections = [];
let currentProjectId;
let argv;

let udpServer;
let arduinoPort;

const init = async (argvValue) => {
  argv = argvValue;
  htmlFolderPath = path.resolve(__dirname, '..');
  srcFolderPath = path.resolve(__dirname, '..', '..', 'src');
  projectDirectory = argvValue.projectDirectory ? argvValue.projectDirectory : path.resolve(__dirname, '..', '..');
  configJSONPath = path.resolve(projectDirectory, argv['config-json-path']);
  expressApp = express();
  expressApp.use(cors());
  // parse application/x-www-form-urlencoded
  expressApp.use(bodyParser.urlencoded({ extended: false }))
  // parse application/json
  expressApp.use(bodyParser.json())
  server = http.Server(expressApp);
  port = process.env.PORT || 80;
  wsServer = new WebSocketServer({
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

    const extendedConnection = {
      connection,
      request
    };
    extendedConnections.push(extendedConnection);
    console.log((new Date()) + ' Connection accepted.');
  
    // connection listeners
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        console.log('Received Message: ' + message.utf8Data);
        wsServer.broadcastUTF(message.utf8Data);
        try {
          const parsed = JSON.parse(message.utf8Data);
          handleParsedMessage(parsed);
        } catch (e) {
          console.log(e);
        }
      }
      else if (message.type === 'binary') {
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        wsServer.broadcastBytes(message.binaryData);
      }
    });
  
    connection.on('close', function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
      const extendedConnectionIndex = extendedConnections.findIndex(extendedConnection => extendedConnection.connection === connection);
      if (extendedConnectionIndex > -1) {
        extendedConnections.splice(extendedConnectionIndex, 1);
      }
    });
  
    initializeView();
  });

  // only used in editor
  expressApp.get('/api/images', async (req, res) => {
    const localPath = path.resolve(projectDirectory);
    const localPathLength = localPath.length;
    const serverURL = req.protocol + '://' + req.get('host') + '/';
    // find all jpg, png or gif files in folder and subfolders, without an external package
    const imageFilePaths = await findFiles(localPath, /\.(jpg|png|gif)$/);
    return res.send(JSON.stringify({
      'result': 'ok',
      'data': imageFilePaths.map(imageFilePath => serverURL + imageFilePath.substring(localPathLength+1))
    }));
  });

  expressApp.post('/graphql', (req, res) => {
    if (argv['cms-graphql-url']) {
      // use http or https?
      const httplib = argv['cms-graphql-url'].startsWith('https') ? https : http;
      // send the graphql request to the cms
      httplib.request(argv['cms-graphql-url'], {
        timeout: 5000,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: req.body
      }, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          // cache the projects locally
          readFilePromised(configJSONPath, 'utf8').then((configJSON) => {
            const config = JSON.parse(configJSON);
            const localPath = path.resolve(projectDirectory, config.data.path);
            fs.writeFile(localPath, data, (err) => {
              if (err) {
                console.log(err);
              }
              // send the response to the client
              res.send(data);
            });
          });
        });
      }).on("error", (err) => {
        console.log("Error: " + err.message);
        res.send(JSON.stringify({
          'result': 'error',
          'message': err.message
        }));
      }).end(JSON.stringify(req.body));
    } else {
      getProjects(req.protocol + '://' + req.get('host') + '/').then((result) => {
        return res.send(JSON.stringify(result));
      });
    }
  });
  
  expressApp.get('/index.html', (req, res) => {
    res.sendFile(path.resolve(htmlFolderPath, 'index.html'));
  });
  expressApp.get('/controlpanel.html', (req, res) => {
    res.sendFile(path.resolve(htmlFolderPath, 'controlpanel.html'));
  });
  expressApp.use(express.static(path.resolve(projectDirectory)));
  expressApp.use('/src', express.static(srcFolderPath));
  expressApp.use(express.static(path.resolve(srcFolderPath)));
  server.listen(port, () => {
   console.log(`App listening on port ${port}!`);
  });

  udpServer = dgram.createSocket('udp4');
  udpServer.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    udpServer.close();
  });

  udpServer.on('message', (msg, rinfo) => {
    console.log(`udp got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    if (rinfo.port === 8888) {
      console.log("shutdown");
      if (isWindows) {
        shutDownWin.shutdown(1, true);
      }
    } else if (rinfo.port === 8889) {
      console.log("go to next");
      sendKeyPressed({ key: 'right' });
      goToNextProject();
    }
  });

  udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

  udpServer.bind(7);

  const serialPorts = await SerialPort.list();
  console.log(serialPorts.map(serialPort => `${serialPort.path} (${serialPort.manufacturer})`));
  const autoDetectedPort = serialPorts.find(port => port.manufacturer && port.manufacturer.toLowerCase().indexOf("arduino") > -1 && port.serialNumber !== 'HIDPC');
  if (autoDetectedPort) {
    console.log(`Connecting To: ${autoDetectedPort.path} (${autoDetectedPort.manufacturer})`);
    arduinoPort = new SerialPort({ path: autoDetectedPort.path, baudRate: 9600 });
    // console.log(arduinoPort);
    arduinoPort.on('open', () => {
      console.log("arduinoport opened");
      initializeView();
    });
  } else {
    initializeView();
  }
};

const initializeView = async () => {
  const config = JSON.parse(await readFilePromised(configJSONPath, 'utf8'));
  const hasProjectsOverview = !(config.scenes.projectsOverview.disabled)
  if (hasProjectsOverview) {
    extendedConnections.forEach(extendedConnection => {
      requestShowProjectsOverview(extendedConnection.connection);
    });
    sendToArduino("a");
  } else {
    currentProjectId = false;
    await goToNextProject();
  }
};

const handleParsedMessage = parsedMessage => {
  if (parsedMessage.type === 'save-config') {
    fs.writeFileSync(configJSONPath, JSON.stringify(parsedMessage.json, null, 2));
  } else if (parsedMessage.type === 'show-project' && parsedMessage.data && parsedMessage.data.id) {
    currentProjectId = parsedMessage.data.id;
    sendToArduino("b");
  } else if (parsedMessage.type === 'show-next-project') {
    goToNextProject();
  } else if (parsedMessage.type === 'show-projects-overview') {
    console.log('reset current project id');
    currentProjectId = false;
    sendToArduino("a");
  } else if (parsedMessage.type === 'crash') {
    console.log('requested crash');
    process.exit();
  }
};

const getProjects = async (serverURL = 'http://localhost/') => {
  const config = JSON.parse(await readFilePromised(configJSONPath, 'utf8'));
  const localPath = path.resolve(projectDirectory, config.data.path);
  const result = JSON.parse(await readFilePromised(localPath, 'utf8'));
  return result;
};

const goToNextProject = async () => {
  const config = JSON.parse(await readFilePromised(configJSONPath, 'utf8'));
  const result = await getProjects('');
  const projects = getValueByPath(result, config.data.projectsKey);
  let currentProjectIndex = projects.findIndex(project => {
    return project.id === currentProjectId
  });
  currentProjectIndex++;
  if (currentProjectIndex >= projects.length) {
    currentProjectIndex = 0;
  }
  currentProjectId = projects[currentProjectIndex].id;
  // turn lights off
  sendToArduino("b");
  // show the next project
  extendedConnections.forEach(extendedConnection => {
    const project = JSON.parse(JSON.stringify(projects[currentProjectIndex]));
    requestShowProject(extendedConnection.connection, project);
  });
};

const sendKeyPressed = async ({ key }) => {
  extendedConnections.forEach(extendedConnection => {
    requestKeyPressed(extendedConnection.connection, { key });
  });
};

const sendToArduino = (messageString) => {
  console.log("send to arduino: " + messageString);
  if (arduinoPort) {
    arduinoPort.write(messageString);
  }
};

const findFiles = async (dirPath, regex, arrayOfFiles = []) => {
  const files = await readDirPromised(dirPath);
  for(const file of files) {
    const filePath = path.join(dirPath, file);
    const isDir = (await statPromised(filePath)).isDirectory();
    if (isDir) {
      await findFiles(filePath, regex, arrayOfFiles);
    } else if (file.match(regex)) {
      arrayOfFiles.push(filePath);
    }
  }
  return arrayOfFiles;
};

export {
  init,
  goToNextProject,
  sendKeyPressed
}