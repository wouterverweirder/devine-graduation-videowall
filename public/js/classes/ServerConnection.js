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
    this.client.send(JSON.stringify(object));
  }

  requestClearScene() {
    this.sendRequest({
      type: 'clear-scene',
    });
  }

  requestCreatePlaneOnScreen(userData) {
    this.sendRequest({
      type: 'create-plane-on-screen',
      userData
    });
  }

  requestRemoveObject(userData) {
    this.sendRequest({
      type: 'remove-object',
      userData
    });
  }
}

export { ServerConnection };