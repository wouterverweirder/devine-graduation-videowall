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

const requestShowNextProject = (client) => {
  sendRequest(client, {
    type: 'show-next-project'
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

const requestShowBouncingDVDLogo = (client) => {
  sendRequest(client, {
    type: 'show-bouncing-dvd-logo'
  });
};

const requestKeyPressed = (client, data) => {
  sendRequest(client, {
    type: 'key-pressed',
    data
  });
};

const requestCrash = (client) => {
  sendRequest(client, {
    type: 'crash'
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

  requestShowNextProject(project) {
    requestShowNextProject(this.client);
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