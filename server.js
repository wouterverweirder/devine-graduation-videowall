const fs = require('fs');
const http = require('http');
const glob = require('glob');
const express = require('express');
const expressApp = express();
const WebSocketServer = require('websocket').server;
const { profile } = require('console');
const server = http.Server(expressApp);
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

const handleParsedMessage = parsedMessage => {
  if (parsedMessage.type === 'save-config') {
    fs.writeFileSync('public/config.json', JSON.stringify(parsedMessage.json, null, 2));
  }
};

wsServer.on('request', function(request) {
  const connection = request.accept();
  console.log((new Date()) + ' Connection accepted.');
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
  const localPath = './public/assets/projects.json';
  const localPathLength = localPath.length;
  const serverURL = req.protocol + '://' + req.get('host') + '/';
  fs.readFile(localPath, 'utf8', (err, contents) => {
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