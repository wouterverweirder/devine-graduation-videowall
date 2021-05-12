import fs from 'fs';
import http from 'http';
import glob from 'glob';
import express from 'express';
import { server as WebSocketServer } from 'websocket';

const expressApp = express();
const server = http.Server(expressApp);
const port = process.env.PORT || 80;

import { requestShowBouncingDVDLogo, requestShowProject, requestShowProjectsOverview } from './public/js/classes/ServerConnection.js';

const wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

const handleParsedMessage = parsedMessage => {
  if (parsedMessage.type === 'save-config') {
    fs.writeFileSync('public/config.json', JSON.stringify(parsedMessage.json, null, 2));
  }
};

wsServer.on('request', function(request) {

  const connection = request.accept();
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
  });

  // initial commands
  requestShowBouncingDVDLogo(connection);
  // requestShowProjectsOverview(connection);
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

const getProjects = (serverURL = 'http://localhost/') => {
  const localPath = './public/assets/projects.json';
  return new Promise((resolve, reject) => {
    fs.readFile(localPath, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }
      const projects = JSON.parse(contents);
      projects.forEach(project => {
        if (project.profilePicture) {
          project.profilePicture.url = serverURL + project.profilePicture.url;
        }
        if (project.mainAsset) {
          project.mainAsset.url = serverURL + project.mainAsset.url;
        }
        project.assets.forEach(asset => asset.url = serverURL + asset.url);
      });
      resolve(projects);
    });
  });
};

expressApp.get('/api/projects', (req, res) => {
  getProjects(req.protocol + '://' + req.get('host') + '/').then((projects) => {
    return res.send(JSON.stringify({
      'result': 'ok',
      'data': projects
    }));
  });
});

expressApp.use(express.static('public'));
server.listen(port, () => {
 console.log(`App listening on port ${port}!`);
});