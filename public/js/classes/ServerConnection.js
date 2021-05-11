const sendRequest = (client, object) => {
  client.send(JSON.stringify(object));
};

const requestClearScene = (client) => {
  sendRequest(client, {
    type: 'clear-scene',
  });
};

const requestShowProjectsOverview = (client) => {
  sendRequest(client, {
    type: 'show-projects-overview'
  });
};

const requestShowProject = (client, project) => {
  sendRequest(client, {
    type: 'show-project',
    data: project
  });
};

const requestCreatePlaneOnScreen = (client, userData) => {
  sendRequest(client, {
    type: 'create-plane-on-screen',
    userData
  });
};

const requestRemoveObject = (client, userData) => {
  sendRequest(client, {
    type: 'remove-object',
    userData
  });
};

const requestSetObjectProps = (client, userData) => {
  sendRequest(client, {
    type: 'set-object-props',
    userData
  });
};

class ServerConnection {
  constructor() {
    this.messageQueue = Promise.resolve();
    this.onopen = () => {};
    this.onmessage = () => {};
  }

  connect(address) {
    this.client = new WebSocket(`ws://${address}`);
    this.client.onopen = () => {
      this.onopen();
    };
    this.client.onmessage = (message) => {
      this.messageQueue = this.messageQueue.then(() => this.onmessage(message));
    };
  }

  sendRequest(object) {
    sendRequest(this.client, object);
  }

  requestClearScene() {
    requestClearScene(this.client);
  }

  requestShowProjectsOverview() {
    requestShowProjectsOverview(this.client);
  }

  requestShowProject(project) {
    requestShowProject(this.client, project);
  }

  requestCreatePlaneOnScreen(userData) {
    requestCreatePlaneOnScreen(this.client, userData);
  }

  requestRemoveObject(userData) {
    requestRemoveObject(this.client, userData);
  }

  requestSetObjectProps(userData) {
    requestSetObjectProps(this.client, userData);
  }
}

export {
  sendRequest,
  requestClearScene,
  requestShowProjectsOverview,
  requestShowProject,
  requestCreatePlaneOnScreen,
  requestRemoveObject,
  requestSetObjectProps,
  ServerConnection
};