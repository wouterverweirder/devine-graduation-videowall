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

const requestCreatePlaneOnScreen = (client, data) => {
  sendRequest(client, {
    type: 'create-plane-on-screen',
    data
  });
};

const requestRemoveObject = (client, data) => {
  sendRequest(client, {
    type: 'remove-object',
    data
  });
};

const requestSetObjectProps = (client, data) => {
  sendRequest(client, {
    type: 'set-object-props',
    data
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

  requestCreatePlaneOnScreen(data) {
    requestCreatePlaneOnScreen(this.client, data);
  }

  requestRemoveObject(data) {
    requestRemoveObject(this.client, data);
  }

  requestSetObjectProps(data) {
    requestSetObjectProps(this.client, data);
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