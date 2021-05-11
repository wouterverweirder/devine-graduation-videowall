import * as THREE from '../three.js/build/three.module.js';

import { gsap, Cubic, Power1 } from '../gsap/src/index.js';

import { ServerConnection } from './ServerConnection.js';
import { createCamerasForConfig, calculateBoundsOfAllScreenCameras, getScreenCamerasForRole, getFirstScreenCameraForRole } from '../functions/screenUtils.js';
import { createPlaneForScreen } from '../functions/createPlaneForScreen.js';
import { ImagePlane } from './scene/ImagePlane.js';
import { ScreenRole } from '../consts/ScreenRole.js';
import { PlaneType } from '../consts/PlaneType.js';

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
            await this.onRequestCreatePlaneOnScreen(parsedMessage.data);
          } else if (parsedMessage.type === 'clear-scene') {
            await this.onRequestClearScene();
          } else if (parsedMessage.type === 'remove-object') {
            await this.onRequestRemoveObject(parsedMessage.data);
          } else if (parsedMessage.type === 'set-object-props') {
            await this.onRequestSetObjectProps(parsedMessage.data);
          } else if (parsedMessage.type === 'show-projects-overview') {
            await this.onRequestShowProjectsOverview();
          } else if (parsedMessage.type === 'show-project') {
            await this.onRequestShowProject(parsedMessage.data);
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

  async onRequestCreatePlaneOnScreen (data) {
    const screenConfig = this.screenConfigsById[data.screenId];
    if (!screenConfig) {
      return;
    }
    const plane = await createPlaneForScreen({data, screenConfig});
    this.objects.push(plane);
    this.onSceneObjectAdded(plane);
  }

  async onRequestRemoveObject (data) {
    let applicableObjects = this.objects.filter(object => {
      return object.id === data.id
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

  async onRequestSetObjectProps (data) {
    let applicableObjects = this.objects.filter(object => {
      return object.id === data.id
    });
    if (this.camerasById[data.id]) {
      applicableObjects.push(this.camerasById[data.id]);
    }
    applicableObjects.forEach(object => {
      if (object.applyProps) {
        object.applyProps(data.props);
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
          x: 1920,
          y: 1920
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

  async onRequestShowProject(project) {

    const createProjectPlane = async (screenCamera, planeType, data) => {
      if (screenCamera) {
        const screenConfig = this.screenConfigsById[screenCamera.id];
        const plane = await createPlaneForScreen({
          data: {
            type: planeType,
            data
          },
          screenConfig
        });
        return plane;
      }
      return false;
    };

    const projectPlanes = [];

    if (project.profilePicture) {
      projectPlanes.push(await createProjectPlane(getFirstScreenCameraForRole(this.cameras, ScreenRole.PROFILE_PICTURE), PlaneType.PROFILE_PICTURE, project));
    }
    if (project.description) {
      projectPlanes.push(await createProjectPlane(getFirstScreenCameraForRole(this.cameras, ScreenRole.PROJECT_DESCRIPTION), PlaneType.PROJECT_DESCRIPTION, project));
    }
    if (project.mainAsset) {
      projectPlanes.push(await createProjectPlane(getFirstScreenCameraForRole(this.cameras, ScreenRole.MAIN_VIDEO), PlaneType.PROJECT_ASSETS, [project.mainAsset]));
    }
    // TMP: show project description as profile
    if (project.description) {
      projectPlanes.push(await createProjectPlane(getFirstScreenCameraForRole(this.cameras, ScreenRole.PROFILE_DESCRIPTION), PlaneType.PROJECT_DESCRIPTION, project));
    }
    //
    const portraitScreenshots = project.assets.filter(asset => {
      if (asset.mime.indexOf('image') === -1) {
        return false;
      }
      return asset.width < asset.height;
    });
    const landscapeScreenshots = project.assets.filter(asset => {
      if (asset.mime.indexOf('image') === -1) {
        return false;
      }
      return asset.width > asset.height;
    });
    if (portraitScreenshots.length > 0) {
      projectPlanes.push(await createProjectPlane(getFirstScreenCameraForRole(this.cameras, ScreenRole.PORTRAIT_SCREENSHOTS), PlaneType.PROJECT_ASSETS, portraitScreenshots));
    }
    if (landscapeScreenshots.length > 0) {
      projectPlanes.push(await createProjectPlane(getFirstScreenCameraForRole(this.cameras, ScreenRole.LANDSCAPE_SCREENSHOTS), PlaneType.PROJECT_ASSETS, landscapeScreenshots));
    }

    let videos = project.assets.filter(asset => {
      return (asset.mime.indexOf('video') === 0);
    });
    let videoScreenCameras = getScreenCamerasForRole(this.cameras, ScreenRole.VIDEOS);
    if (videoScreenCameras.length > 0 && videos.length > 0) {
      projectPlanes.push(await createProjectPlane(videoScreenCameras.pop(), PlaneType.PROJECT_ASSETS, [videos.pop()]));
    }
    if (videoScreenCameras.length > 0 && videos.length > 0) {
      projectPlanes.push(await createProjectPlane(videoScreenCameras.pop(), PlaneType.PROJECT_ASSETS, [videos.pop()]));
    }

    const tl = gsap.timeline({
      onUpdate: () => {
        projectPlanes.forEach(plane => plane.applyProps(plane.props));
      }
    });

    const maxDelay = .5;
    projectPlanes.forEach((plane, index) => {
      const startPropValues = JSON.parse(JSON.stringify(plane.props));
      const endPropValues = JSON.parse(JSON.stringify(plane.props));

      startPropValues.scale.x *= 0;
      startPropValues.scale.y *= 0;

      plane.applyProps(startPropValues);

      const delay = Power1.easeInOut(index / projectPlanes.length) * maxDelay;
      tl.to(plane.props.scale, {x: endPropValues.scale.x, y: endPropValues.scale.y, ease: Power1.easeInOut, delay }, 0);

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