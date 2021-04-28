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
  serverConnection = new ServerConnection()

  constructor(config) {
    this.config = config;
  }

  init = async () => {
    this.config.screens.forEach(screenConfig => this.screenConfigsById[screenConfig.id] = screenConfig);

    this.cameras = createCamerasForConfig(this.config);
    this.cameras.forEach(camera => this.camerasById[camera.userData.id] = camera);
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

  onSceneObjectChanged = (object) => {
  }

  onRequestCreatePlaneOnScreen = async (userData) => {
    const screenConfig = this.screenConfigsById[userData.screenId];
    if (!screenConfig) {
      return;
    }
    const plane = await createPlaneForScreen({userData, screenConfig, appConfig: this.config});
    this.scene.add(plane);
    this.objects.push(plane);
    this.onSceneObjectAdded(plane);
  };

  onRequestRemoveObject = async (userData) => {
    let applicableObjects = this.objects.filter(object => {
      return object.userData.id === userData.id
    });
    applicableObjects.forEach(object => {
      this.scene.remove(object);
      let index = this.objects.indexOf(object);
      if (index > -1) {
        this.objects.splice(index, 1);
      }
      this.onSceneObjectRemoved(object);
    });
  };

  onRequestClearScene = () => {
    this.objects.forEach(object => {
      this.scene.remove(object);
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
    if (object.userData.type === 'canvas') {
      const canvasTexture = object.material.map;
      const planeCanvas = canvasTexture.image;
      const planeCtx = planeCanvas.getContext('2d');
      // planeCtx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}`;
      // planeCtx.fillRect(0, 0, planeCanvas.width, planeCanvas.height);
      canvasTexture.needsUpdate = true;
    }
    this.onSceneObjectChanged(object);
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