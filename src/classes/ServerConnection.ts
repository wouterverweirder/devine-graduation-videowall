import { CreatePlaneForScreenData } from "../functions/createPlaneForScreen";
import { Project } from "../types";
import { connection } from "websocket";

const sendRequest = (client:WebSocket|connection, object:unknown) => {
  client.send(JSON.stringify(object));
};

const requestClearScene = (client:WebSocket|connection) => {
  sendRequest(client, {
    type: 'clear-scene',
  });
};

const requestShowProjectsOverview = (client:WebSocket|connection) => {
  sendRequest(client, {
    type: 'show-projects-overview'
  });
};

const requestShowProject = (client:WebSocket|connection, project:Project) => {
  sendRequest(client, {
    type: 'show-project',
    data: project
  });
};

const requestShowNextProject = (client:WebSocket|connection) => {
  sendRequest(client, {
    type: 'show-next-project'
  });
};

const requestCreatePlaneOnScreen = (client:WebSocket|connection, data:CreatePlaneForScreenData) => {
  sendRequest(client, {
    type: 'create-plane-on-screen',
    data
  });
};

const requestRemoveObject = (client:WebSocket|connection, data:unknown) => {
  sendRequest(client, {
    type: 'remove-object',
    data
  });
};

const requestSetObjectProps = (client:WebSocket|connection, data:unknown) => {
  sendRequest(client, {
    type: 'set-object-props',
    data
  });
};

const requestShowBouncingDVDLogo = (client:WebSocket|connection) => {
  sendRequest(client, {
    type: 'show-bouncing-dvd-logo'
  });
};

const requestKeyPressed = (client:WebSocket|connection, data:unknown) => {
  sendRequest(client, {
    type: 'key-pressed',
    data
  });
};

const requestCrash = (client:WebSocket|connection) => {
  sendRequest(client, {
    type: 'crash'
  });
};

class ServerConnection {

  messageQueue: Promise<void>;
  onopen: () => void;
  onmessage: (message: MessageEvent) => void;
  client: WebSocket;

  constructor() {
    this.messageQueue = Promise.resolve();
    this.onopen = () => {};
    this.onmessage = () => {};
  }

  connect(address:string) {
    this.client = new WebSocket(`ws://${address}`);
    this.client.onopen = () => {
      this.onopen();
    };
    this.client.onmessage = (message) => {
      this.messageQueue = this.messageQueue.then(() => this.onmessage(message));
    };
  }

  sendRequest(object:unknown) {
    sendRequest(this.client, object);
  }

  requestClearScene() {
    requestClearScene(this.client);
  }

  requestShowProjectsOverview() {
    requestShowProjectsOverview(this.client);
  }

  requestShowProject(project:Project) {
    requestShowProject(this.client, project);
  }

  requestShowNextProject() {
    requestShowNextProject(this.client);
  }

  requestCreatePlaneOnScreen(data:CreatePlaneForScreenData) {
    requestCreatePlaneOnScreen(this.client, data);
  }

  requestRemoveObject(data:unknown) {
    requestRemoveObject(this.client, data);
  }

  requestSetObjectProps(data:unknown) {
    requestSetObjectProps(this.client, data);
  }

  requestShowBouncingDVDLogo() {
    requestShowBouncingDVDLogo(this.client);
  }

  requestCrash() {
    requestCrash(this.client);
  }
}

export {
  sendRequest,
  requestClearScene,
  requestShowProjectsOverview,
  requestShowProject,
  requestShowNextProject,
  requestCreatePlaneOnScreen,
  requestRemoveObject,
  requestSetObjectProps,
  requestShowBouncingDVDLogo,
  requestKeyPressed,
  requestCrash,
  ServerConnection
};