import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import * as core from "express-serve-static-core";
import { writeFileSync } from 'fs';
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import http, { Server } from 'http';
import https from 'https';
import path from 'path';
import { connection, request, server as WebSocketServer } from 'websocket';
import { requestKeyPressed, requestShowProject, requestShowProjectsOverview } from '../classes/ServerConnection';
import { getValueByPath } from '../functions/getValueByPath';
import { ArgV } from '../options';

let projectDirectory:string;
let configJSONPath:string;

let expressApp:core.Express;
let expressServer:Server;
let port:string|number;
let wsServer:WebSocketServer;
const extendedConnections:{
  connection: connection;
  request: request;
}[] = [];
let currentProjectId:string|boolean = false;
let argv:ArgV;

const init = async (argvValue:ArgV) => {
  return new Promise<void>((resolve) => {
    if (expressServer) {
      expressServer.close();
      expressServer = undefined;
    }
    if (wsServer) {
      wsServer.shutDown();
      wsServer = undefined;
    }
    argv = argvValue;
    projectDirectory = argvValue.projectDirectory ? argvValue.projectDirectory : path.resolve(__dirname, '..', '..');
    configJSONPath = path.resolve(projectDirectory, argv['config-json-path']);
    expressApp = express();
    expressApp.use(cors());
    expressApp.use(bodyParser.urlencoded({ extended: false }))
    expressApp.use(bodyParser.json())
    expressServer = new http.Server(expressApp);
    port = process.env.PORT || 80;
    wsServer = new WebSocketServer({
      httpServer: expressServer,
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
    
      connection.on('close', function() {
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
      const serverURL = req.protocol + '://' + req.get('host') + '/';
      const images = await getImages(serverURL);
      res.send(JSON.stringify({
        'result': 'ok',
        'data': images
      }));
    });
  
    expressApp.post('/graphql', async (req, res) => {
      if (argv['cms-graphql-url']) {
        try {
          const result = await getProjectsFromGraphQL(JSON.stringify(req.body));
          const configJSON = await readFile(configJSONPath, 'utf8');
          const config = JSON.parse(configJSON);
          const localPath = path.resolve(projectDirectory, config.data.path);
          await writeFile(localPath, JSON.stringify(result, null, 2));
          res.send(JSON.stringify(result));
        } catch (err) {
          console.log("Error: " + err.message);
          res.send(JSON.stringify({
            'result': 'error',
            'message': err.message
          }));
          return;
        }
      } else {
        const result = await getProjects();
        res.send(JSON.stringify(result));
      }
    });
    
    expressApp.use(express.static(path.resolve(projectDirectory)));
    expressServer.listen(port, () => {
     console.log(`App listening on port ${port}!`);
     resolve();
    });
  });
};

const initializeView = async () => {
  const config = JSON.parse(await readFile(configJSONPath, 'utf8'));
  const hasProjectsOverview = !(config.scenes.projectsOverview.disabled)
  if (hasProjectsOverview) {
    extendedConnections.forEach(extendedConnection => {
      requestShowProjectsOverview(extendedConnection.connection);
    });
  } else {
    currentProjectId = false;
    await goToNextProject();
  }
};

const handleParsedMessage = (parsedMessage: { type: string, data?: unknown, json?: string}) => {
  if (parsedMessage.type === 'save-config') {
    writeFileSync(configJSONPath, JSON.stringify(parsedMessage.json, null, 2));
  } else if (parsedMessage.type === 'show-project' && typeof parsedMessage.data === 'object' && 'id' in parsedMessage.data && typeof parsedMessage.data.id === 'string') {
    currentProjectId = parsedMessage.data.id;
  } else if (parsedMessage.type === 'show-next-project') {
    goToNextProject();
  } else if (parsedMessage.type === 'show-projects-overview') {
    console.log('reset current project id');
    currentProjectId = false;
  } else if (parsedMessage.type === 'crash') {
    console.log('requested crash');
    process.exit();
  }
};

const getImages = async (serverURL:string = 'http://127.0.0.1/') => {
  const localPath = path.resolve(projectDirectory);
  const localPathLength = localPath.length;
  // find all jpg, png or gif files in folder and subfolders, without an external package
  const imageFilePaths = await findFiles(localPath, /\.(jpg|png|gif)$/);
  return imageFilePaths.map(imageFilePath => serverURL + imageFilePath.substring(localPathLength+1));
};

const getProjects = async () => {
  const config = JSON.parse(await readFile(configJSONPath, 'utf8'));
  const localPath = path.resolve(projectDirectory, config.data.path);
  const result = JSON.parse(await readFile(localPath, 'utf8'));
  return result;
};

const getProjectsFromGraphQL = async (graphQL:string) => {
  return new Promise((resolve, reject) => {
    // use http or https?
    const httplib = argv['cms-graphql-url'].startsWith('https') ? https : http;
    // send the graphql request to the cms
    const reqOptions = {
      timeout: 5000,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const proxyReq = httplib.request(argv['cms-graphql-url'], reqOptions, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        const result = JSON.parse(data);
        resolve(result);
      });
    });
    proxyReq.on("error", (err) => {
      console.log("Error: " + err.message);
      reject(err);
    });
    proxyReq.write(graphQL);
    proxyReq.end();
  });
};

const goToNextProject = async () => {
  const config = JSON.parse(await readFile(configJSONPath, 'utf8'));
  const result = await getProjects();
  const projects = getValueByPath(result, config.data.projectsKey) as {id:string}[];
  let currentProjectIndex = projects.findIndex(project => {
    return project.id === currentProjectId
  });
  currentProjectIndex++;
  if (currentProjectIndex >= projects.length) {
    currentProjectIndex = 0;
  }
  currentProjectId = projects[currentProjectIndex].id;
  // show the next project
  extendedConnections.forEach(extendedConnection => {
    const project = JSON.parse(JSON.stringify(projects[currentProjectIndex]));
    requestShowProject(extendedConnection.connection, project);
  });
};

const sendKeyPressed = async ({ key }: { key: string }) => {
  extendedConnections.forEach(extendedConnection => {
    requestKeyPressed(extendedConnection.connection, { key });
  });
};

const findFiles = async (dirPath:string, regex:RegExp, arrayOfFiles:string[] = []) => {
  const files = await readdir(dirPath);
  for(const file of files) {
    const filePath = path.join(dirPath, file);
    const isDir = (await stat(filePath)).isDirectory();
    if (isDir) {
      await findFiles(filePath, regex, arrayOfFiles);
    } else if (file.match(regex)) {
      arrayOfFiles.push(filePath);
    }
  }
  return arrayOfFiles;
};

export { goToNextProject, init, initializeView, sendKeyPressed };

