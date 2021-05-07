import * as THREE from '../three.js/build/three.module.js';

import { ServerConnection } from './ServerConnection.js';
import { createCamerasForConfig } from '../functions/createCamerasForConfig.js';
import { createPlaneForScreen } from '../functions/createPlaneForScreen.js';

class Application {

  config;
  renderer;
  scene;
  cameras;
  screenConfigsById = {};
  camerasById = {};
  objects = [];
  serverConnection = new ServerConnection();
  projects;

  constructor(config) {
    this.config = config;
  }

  init = async () => {

    const projectsJSON = await (await fetch('assets/projects.json')).json();
    this.projects = projectsJSON.projects;

    this.config.screens.forEach(screenConfig => this.screenConfigsById[screenConfig.id] = screenConfig);

    this.cameras = await createCamerasForConfig(this.config);
    this.cameras.forEach(camera => this.camerasById[camera.id] = camera);
    this.scene = new THREE.Scene();

    this.setupApplicationSpecificUI();

    this.serverConnection.onopen = () => {
      this.onServerConnectionOpen();
    };
    this.serverConnection.onmessage = async (message) => {
      try {
        const parsedMessage = JSON.parse(message.data);
        if (parsedMessage.type) {
          if (parsedMessage.type === 'create-plane-on-screen') {
            await this.onRequestCreatePlaneOnScreen(parsedMessage.userData);
          } else if (parsedMessage.type === 'clear-scene') {
            await this.onRequestClearScene();
          } else if (parsedMessage.type === 'remove-object') {
            await this.onRequestRemoveObject(parsedMessage.userData);
          } else if (parsedMessage.type === 'set-object-props') {
            await this.onRequestSetObjectProps(parsedMessage.userData);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    this.connectToServer();

    requestAnimationFrame(this.render);
  }

  setupApplicationSpecificUI = () => {
    // needs to be implemented by extending class if needed
  }

  onServerConnectionOpen = () => {
  }

  connectToServer = () => {
    // needs to be implemented by extending class if needed
  }

  onSceneObjectAdded = (object) => {
  }

  onSceneObjectRemoved = (object) => {
  }

  onSceneObjectRender = (object) => {
  }

  onSceneObjectPropsChanged = (object) => {
  }

  onRequestCreatePlaneOnScreen = async (userData) => {
    const screenConfig = this.screenConfigsById[userData.screenId];
    if (!screenConfig) {
      return;
    }
    const plane = await createPlaneForScreen({userData, screenConfig, appConfig: this.config});
    this.objects.push(plane);
    this.onSceneObjectAdded(plane);
  };

  onRequestRemoveObject = async (userData) => {
    let applicableObjects = this.objects.filter(object => {
      return object.id === userData.id
    });
    applicableObjects.forEach(object => {
      let index = this.objects.indexOf(object);
      if (index > -1) {
        this.objects.splice(index, 1);
      }
      this.onSceneObjectRemoved(object);
      if (object.dispose) {
        object.dispose();
      }
    });
  };

  onRequestSetObjectProps = async (userData) => {
    let applicableObjects = this.objects.filter(object => {
      return object.id === userData.id
    });
    if (this.camerasById[userData.id]) {
      applicableObjects.push(this.camerasById[userData.id]);
    }
    applicableObjects.forEach(object => {
      if (object.applyProps) {
        object.applyProps(userData.props);
      }
      this.onSceneObjectPropsChanged(object);
    });
  };

  onRequestClearScene = () => {
    this.objects.forEach(object => {
      this.onSceneObjectRemoved(object);
    });
    this.objects = [];
  };

  updateObjects = () => {
    this.objects.forEach((object) => {
      this.updateObject(object);
    });
  };

  updateObject = (object) => {
    object.render();
    this.onSceneObjectRender(object);
  };

  render = (time) => {

    this.updateObjects();
    this.applicationSpecificRender();
      
    requestAnimationFrame(this.render);
  };

  applicationSpecificRender = () => {
  };
}

export { Application }