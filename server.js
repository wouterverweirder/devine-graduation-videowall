import fs from 'fs';
import http from 'http';
import glob from 'glob';
import express from 'express';
import { server as WebSocketServer } from 'websocket';
import { requestKeyPressed, requestShowProject, requestShowProjectsOverview } from './public/js/classes/ServerConnection.js';
import dgram from 'dgram';
import SerialPort from 'serialport';
import shutDownWin from './node-shutdown-windows.js';

const isWindows = process.platform === "win32";

let expressApp, server, port, wsServer;
let extendedConnections = [];
let currentProjectId;
let argv;

let udpServer;
let arduinoPort;

const init = async (argvValue) => {
  argv = argvValue;
  expressApp = express();
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
  
    // initial commands
    // requestShowBouncingDVDLogo(connection);
    requestShowProjectsOverview(connection);
    sendToArduino("a");
    // getProjects(`http://${request.host}/`).then(projects => {
    //   if (projects.length === 0) {
    //     return;
    //   }
    //   requestShowProject(connection, projects[0]);
    // });
  });

  expressApp.get('/api/images', (req, res) => {
    const localPath = './public/';
    const localPathLength = localPath.length;
    const serverURL = req.protocol + '://' + req.get('host') + '/';
    glob(`${localPath}assets/**/*.{jpg,png,gif}`, (err, matches) => {
      return res.send(JSON.stringify({
        'result': 'ok',
        'data': matches.map(match =>serverURL + match.substring(localPathLength))
      }));
    });
  });
  
  expressApp.get('/api/projects', (req, res) => {
    getProjects(req.protocol + '://' + req.get('host') + '/').then((projects) => {
      return res.send(JSON.stringify({
        'result': 'ok',
        'data': projects
      }));
    });
  });

  expressApp.get('/api/argv', (req, res) => {
    return res.send(JSON.stringify({
      'result': 'ok',
      'data': argv
    }));
  });
  
  expressApp.use(express.static('public'));
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
  const autoDetectedPort = serialPorts.find(port => port.manufacturer && port.manufacturer.toLowerCase().indexOf("arduino") > -1);
  if (autoDetectedPort) {
    arduinoPort = new SerialPort(autoDetectedPort.path, { baudRate: 9600 });
    arduinoPort.on('open', () => {
      sendToArduino("a");
    });
  }
};

const handleParsedMessage = parsedMessage => {
  if (parsedMessage.type === 'save-config') {
    fs.writeFileSync('public/config.json', JSON.stringify(parsedMessage.json, null, 2));
  } else if (parsedMessage.type === 'show-project' && parsedMessage.data && parsedMessage.data.id) {
    currentProjectId = parsedMessage.data.id;
  } else if (parsedMessage.type === 'show-next-project') {
    goToNextProject();
  } else if (parsedMessage.type === 'show-projects-overview') {
    console.log('reset current project id');
    currentProjectId = false;
    sendToArduino("a");
  }
};

const getProjects = (serverURL = 'http://localhost/') => {
  const localPath = './public/assets/projects.json';
  return new Promise((resolve, reject) => {
    fs.readFile(localPath, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }
      let projects = JSON.parse(contents);
      projects.forEach(project => {
        setProjectUrls(project, serverURL);
      });
      resolve(projects);
    });
  });
};

const setProjectUrls = (project, serverURL) => {
  if (project.profilePicture) {
    project.profilePicture.url = serverURL + project.profilePicture.url;
  }
  if (project.mainAsset) {
    project.mainAsset.url = serverURL + project.mainAsset.url;
  }
  project.assets.forEach(asset => asset.url = serverURL + asset.url);
};

const goToNextProject = async () => {
  const projects = await getProjects('');
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
    setProjectUrls(project, `http://${extendedConnection.request.host}/`);
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
}

export {
  init,
  goToNextProject,
  sendKeyPressed
}