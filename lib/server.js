import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import glob from 'glob';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { server as WebSocketServer } from 'websocket';
import { requestKeyPressed, requestShowProject, requestShowProjectsOverview } from '../src/js/classes/ServerConnection.js';
import dgram from 'dgram';
import { SerialPort } from 'serialport';
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
  
    initializeProjectOverview();
  });

  // only used in editor
  expressApp.get('/api/images', (req, res) => {
    const localPath = path.resolve(__dirname, '..', 'public');
    const localPathLength = localPath.length;
    const serverURL = req.protocol + '://' + req.get('host') + '/';
    glob(`${localPath}assets/**/*.{jpg,png,gif}`, (err, matches) => {
      return res.send(JSON.stringify({
        'result': 'ok',
        'data': matches.map(match =>serverURL + match.substring(localPathLength))
      }));
    });
  });
  
  // only used in editor
  expressApp.get('/api/projects', (req, res) => {
    getProjects(req.protocol + '://' + req.get('host') + '/').then((projects) => {
      return res.send(JSON.stringify({
        'result': 'ok',
        'data': projects
      }));
    });
  });

  expressApp.post('/graphql', (req, res) => {
    if (argv['cms-graphql-url']) {
      // use http or https?
      const httplib = argv['cms-graphql-url'].startsWith('https') ? https : http;
      // send the graphql request to the cms
      httplib.request(argv['cms-graphql-url'], {
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
          const localPath = path.resolve(__dirname, '..', 'public', 'assets', 'projects.json');
          fs.writeFile(localPath, data, (err) => {
            if (err) {
              console.log(err);
            }
            // send the response to the client
            res.send(data);
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
      getProjects(req.protocol + '://' + req.get('host') + '/').then((projects) => {
        return res.send(JSON.stringify({
          'result': 'ok',
          'data': projects
        }));
      });
    }
  });
  
  expressApp.get('/index.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'index.html'));
  });
  expressApp.get('/controlpanel.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'controlpanel.html'));
  });
  expressApp.use(express.static(path.resolve(__dirname, '..', 'public')));
  expressApp.use('/src', express.static(path.resolve(__dirname, '..', 'src')));
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
      initializeProjectOverview();
    });
  } else {
    initializeProjectOverview();
  }
};

const initializeProjectOverview = () => {
  extendedConnections.forEach(extendedConnection => {
    requestShowProjectsOverview(extendedConnection.connection);
  });
  sendToArduino("a");
};

const handleParsedMessage = parsedMessage => {
  if (parsedMessage.type === 'save-config') {
    fs.writeFileSync(path.resolve(__dirname, '..', 'public', 'config.json'), JSON.stringify(parsedMessage.json, null, 2));
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

const getProjects = (serverURL = 'http://localhost/') => {
  const localPath = path.resolve(__dirname, '..', 'public', 'assets', 'projects.json');
  return new Promise((resolve, reject) => {
    fs.readFile(localPath, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }
      const { data } = JSON.parse(contents);
      data.students.data.forEach(student => {
        setProjectUrls(student, serverURL);
      });
      resolve(data);
    });
  });
};

const setProjectUrls = (student, serverURL) => {
  // if (project.attributes.mainAsset.data) {
  //   project.attributes.mainAsset.data.attributes.url  = serverURL + project.attributes.mainAsset.data.attributes.url;
  // }
  // project.attributes.assets.data.forEach(asset => asset.attributes.url = serverURL + asset.attributes.url);
  // project.attributes.students.data.forEach(student => {
  //   if (student.attributes.profilePicture.data) {
  //     student.attributes.profilePicture.data.attributes.url = serverURL + student.attributes.profilePicture.data.attributes.url;
  //   }
  // });
};

const goToNextProject = async () => {
  const { students: projects } = await getProjects('');
  let currentProjectIndex = projects.data.findIndex(project => {
    return project.id === currentProjectId
  });
  currentProjectIndex++;
  if (currentProjectIndex >= projects.data.length) {
    currentProjectIndex = 0;
  }
  currentProjectId = projects.data[currentProjectIndex].id;
  // turn lights off
  sendToArduino("b");
  // show the next project
  extendedConnections.forEach(extendedConnection => {
    const project = JSON.parse(JSON.stringify(projects.data[currentProjectIndex]));
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