import * as THREE from '../three.js/build/three.module.js';

import { ServerConnection } from './ServerConnection.js';
import { createCamerasForConfig, calculateBoundsOfAllScreenCameras } from '../functions/createCamerasForConfig.js';
import { createPlaneForScreen } from '../functions/createPlaneForScreen.js';
import { ImagePlane } from './scene/ImagePlane.js';

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

  async init() {

    const apiProjects = await (await fetch(`http://${this.getServerAddress()}/api/projects`)).json();
    this.projects = apiProjects.data;
    
    this.config.screens.forEach(screenConfig => this.screenConfigsById[screenConfig.id] = screenConfig);
    
    this.cameras = await createCamerasForConfig(this.config);
    this.cameras.forEach(camera => this.camerasById[camera.id] = camera);
    this.fullBounds = calculateBoundsOfAllScreenCameras(this.cameras);
    
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
          } else if (parsedMessage.type === 'show-projects-overview') {
            await this.onRequestShowProjectsOverview();
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    this.connectToServer();

    requestAnimationFrame(() => this.render());
  }

  getServerAddress() {
    return '127.0.0.1';
  }

  setupApplicationSpecificUI() {
    // needs to be implemented by extending class if needed
  }

  onServerConnectionOpen() {
  }

  connectToServer() {
    this.serverConnection.connect(this.getServerAddress());
  }

  onSceneObjectAdded(object) {
  }

  onSceneObjectRemoved(object) {
  }

  onSceneObjectRender (object) {
  }

  onSceneObjectPropsChanged (object) {
  }

  async onRequestCreatePlaneOnScreen (userData) {
    const screenConfig = this.screenConfigsById[userData.screenId];
    if (!screenConfig) {
      return;
    }
    const plane = await createPlaneForScreen({userData, screenConfig, appConfig: this.config});
    this.objects.push(plane);
    this.onSceneObjectAdded(plane);
  }

  async onRequestRemoveObject (userData) {
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
  }

  async onRequestSetObjectProps (userData) {
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
  }

  onRequestClearScene() {
    this.objects.forEach(object => {
      this.onSceneObjectRemoved(object);
    });
    this.objects = [];
  }

  async onRequestShowProjectsOverview () {
    const planes = [];
    // create square planes in background to show student images
    const scale = { x: 0.3, y: 0.3 };
    const gap = 0.05;
    const numCols = 4;
    for (let i = 0; i < this.projects.length; i++) {
      const project = this.projects[i];
      const col = i % numCols;
      const row = Math.floor(i / numCols);
      const randScaleFactor = THREE.MathUtils.randFloat(0.5, 1);
      const props = {
        name: `project ${project.firstName} ${project.lastName}`,
        position: {
          x: col * (scale.x + gap),
          y: row * (scale.y + gap),
          z: 0
        },
        scale: {
          x: scale.x * randScaleFactor,
          y: scale.y * randScaleFactor
        },
        textureSize: {
          x: 1080,
          y: 1080
        },
        url: project.profilePicture.url,
        velocity: {
          x: THREE.MathUtils.randFloat(-0.001, 0.001),
          y: THREE.MathUtils.randFloat(-0.001, 0.001),
          z: 0
        }
      };
      const plane = new ImagePlane(`project-${project.id}`, props);
      await plane.init();
      planes.push(plane);
    }
    planes.forEach(plane => {
      plane.render = () => {
        const velocity = plane.props.velocity;
        if (plane.props.position.x < this.fullBounds.left) {
          velocity.x = Math.abs(velocity.x);
        }
        if (plane.props.position.x > this.fullBounds.right) {
          velocity.x = -Math.abs(velocity.x);
        }
        if (plane.props.position.y < this.fullBounds.bottom) {
          velocity.y = Math.abs(velocity.y);
        }
        if (plane.props.position.y > this.fullBounds.top) {
          velocity.y = -Math.abs(velocity.y);
        }
        plane.applyProps({
          position: {
            x: plane.props.position.x + velocity.x,
            y: plane.props.position.y + velocity.y,
            z: 0
          },
          velocity
        });
        
      };
      this.objects.push(plane);
      this.onSceneObjectAdded(plane);
    });
  }

  updateObjects() {
    this.objects.forEach((object) => {
      this.updateObject(object);
    });
  }

  updateObject(object) {
    object.render();
    this.onSceneObjectRender(object);
  }

  render(time) {

    this.fullBounds = calculateBoundsOfAllScreenCameras(this.cameras);
    this.updateObjects();
    this.applicationSpecificRender();
      
    requestAnimationFrame(() => this.render());
  }

  applicationSpecificRender() {
  }
}

export { Application }