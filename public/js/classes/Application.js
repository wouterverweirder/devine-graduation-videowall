import * as THREE from '../three.js/build/three.module.js';

import { gsap, Power1 } from '../gsap/src/index.js';

import { ServerConnection } from './ServerConnection.js';
import { calculateScaleForScreenConfig, createCamerasForConfig, calculateBoundsOfAllScreenCameras, getScreenCamerasForRole, getFirstScreenCameraForRole } from '../functions/screenUtils.js';
import { createPlaneForScreen } from '../functions/createPlaneForScreen.js';
import { ImagePlane } from './scene/ImagePlane.js';
import { ScreenRole } from '../consts/ScreenRole.js';
import { PlaneType } from '../consts/PlaneType.js';
import { ShaderPlane } from './scene/ShaderPlane.js';

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
          } else if (parsedMessage.type === 'show-bouncing-dvd-logo') {
            await this.onRequestShowBouncingDVDLogo();
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
      if (object.dispose) {
        object.dispose();
      }
    });
    this.objects = [];
  }

  async onRequestShowProjectsOverview () {
    
    const mainScreenCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.MAIN_VIDEO);
    const screenConfig = this.screenConfigsById[mainScreenCamera.id];

    const props = {
      name: `test-shader-plane`,
      position: {
        x: screenConfig.camera.position[0],
        y: screenConfig.camera.position[1] - 0.1,
        z: 0
      },
      scale: calculateScaleForScreenConfig(screenConfig),
      textureSize: {
        x: 1920,
        y: 1080
      },
      url: this.projects[0].profilePicture.url
    };
    const plane = new ImagePlane(props.name, props);
    await plane.init();
    this.objects.push(plane);
    this.onSceneObjectAdded(plane);

    return;

    // const planes = [];
    // // create square planes in background to show student images
    // const scale = { x: 0.3, y: 0.3 };
    // const gap = 0.05;
    // const numCols = 4;
    // for (let i = 0; i < this.projects.length; i++) {
    //   const project = this.projects[i];
    //   const col = i % numCols;
    //   const row = Math.floor(i / numCols);
    //   const randScaleFactor = THREE.MathUtils.randFloat(0.5, 1);
    //   const props = {
    //     name: `project ${project.firstName} ${project.lastName}`,
    //     position: {
    //       x: col * (scale.x + gap),
    //       y: row * (scale.y + gap),
    //       z: 0
    //     },
    //     scale: {
    //       x: scale.x * randScaleFactor,
    //       y: scale.y * randScaleFactor
    //     },
    //     textureSize: {
    //       x: 1920,
    //       y: 1920
    //     },
    //     url: project.profilePicture.url,
    //     velocity: {
    //       x: THREE.MathUtils.randFloat(-0.001, 0.001),
    //       y: THREE.MathUtils.randFloat(-0.001, 0.001),
    //       z: 0
    //     }
    //   };
    //   const plane = new ImagePlane(`project-${project.id}`, props);
    //   await plane.init();
    //   planes.push(plane);
    // }
    // planes.forEach(plane => {
    //   plane.render = () => {
    //     const velocity = plane.props.velocity;
    //     if (plane.props.position.x < this.fullBounds.left) {
    //       velocity.x = Math.abs(velocity.x);
    //     }
    //     if (plane.props.position.x > this.fullBounds.right) {
    //       velocity.x = -Math.abs(velocity.x);
    //     }
    //     if (plane.props.position.y < this.fullBounds.bottom) {
    //       velocity.y = Math.abs(velocity.y);
    //     }
    //     if (plane.props.position.y > this.fullBounds.top) {
    //       velocity.y = -Math.abs(velocity.y);
    //     }
    //     plane.applyProps({
    //       position: {
    //         x: plane.props.position.x + velocity.x,
    //         y: plane.props.position.y + velocity.y,
    //         z: 0
    //       },
    //       velocity
    //     });
        
    //   };
    //   this.objects.push(plane);
    //   this.onSceneObjectAdded(plane);
    // });
  }

  async onRequestShowProject(project) {

    const idPrefix = `project-${project.id}`;

    const createProjectPlane = async (id, screenCamera, planeType, data) => {
      if (screenCamera) {
        const screenConfig = this.screenConfigsById[screenCamera.id];
        const plane = await createPlaneForScreen({
          data: {
            id,
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
      projectPlanes.push(await createProjectPlane(`${idPrefix}-profile-picture`, getFirstScreenCameraForRole(this.cameras, ScreenRole.PROFILE_PICTURE), PlaneType.PROFILE_PICTURE, project));
    }
    if (project.description) {
      projectPlanes.push(await createProjectPlane(`${idPrefix}-project-description`, getFirstScreenCameraForRole(this.cameras, ScreenRole.PROJECT_DESCRIPTION), PlaneType.PROJECT_DESCRIPTION, project));
    }
    if (project.mainAsset) {
      projectPlanes.push(await createProjectPlane(`${idPrefix}-main-asset`, getFirstScreenCameraForRole(this.cameras, ScreenRole.MAIN_VIDEO), PlaneType.PROJECT_ASSETS, [project.mainAsset]));
    }
    if (project.bio) {
      projectPlanes.push(await createProjectPlane(`${idPrefix}-project-bio`, getFirstScreenCameraForRole(this.cameras, ScreenRole.PROJECT_BIO), PlaneType.PROJECT_BIO, project));
    }
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
      projectPlanes.push(await createProjectPlane(`${idPrefix}-portrait-screenshots`, getFirstScreenCameraForRole(this.cameras, ScreenRole.PORTRAIT_SCREENSHOTS), PlaneType.PROJECT_ASSETS, portraitScreenshots));
    }
    if (landscapeScreenshots.length > 0) {
      projectPlanes.push(await createProjectPlane(`${idPrefix}-landscape-screenshots`, getFirstScreenCameraForRole(this.cameras, ScreenRole.LANDSCAPE_SCREENSHOTS), PlaneType.PROJECT_ASSETS, landscapeScreenshots));
    }

    let videos = project.assets.filter(asset => {
      return (asset.mime.indexOf('video') === 0);
    });
    let videoScreenCameras = getScreenCamerasForRole(this.cameras, ScreenRole.VIDEOS);
    if (videoScreenCameras.length > 0 && videos.length > 0) {
      projectPlanes.push(await createProjectPlane(`${idPrefix}-videos-1`, videoScreenCameras.pop(), PlaneType.PROJECT_ASSETS, [videos.pop()]));
    }
    if (videoScreenCameras.length > 0 && videos.length > 0) {
      projectPlanes.push(await createProjectPlane(`${idPrefix}-videos-2`, videoScreenCameras.pop(), PlaneType.PROJECT_ASSETS, [videos.pop()]));
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

  async onRequestShowBouncingDVDLogo() {

    const mainCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.MAIN_VIDEO);

    const screenConfig = this.screenConfigsById[mainCamera.id];
    const textureSize = {
      x: 512,
      y: 237
    };
    const scale = {
      x: textureSize.x / 2000,
      y: textureSize.y / 2000
    }
    const plane = await createPlaneForScreen({
      data: {
        type: 'image',
        url: 'assets/dvd-logo.png',
        scale,
        textureSize,
        velocity: {
          x: 0.001,
          y: 0.001,
          z: 0
        }
      },
      screenConfig
    });
    plane.render = () => {
      const velocity = plane.props.velocity;
      if (plane.props.position.x - scale.x / 2 < this.fullBounds.left) {
        velocity.x = Math.abs(velocity.x);
      }
      if (plane.props.position.x + scale.x / 2 > this.fullBounds.right) {
        velocity.x = -Math.abs(velocity.x);
      }
      if (plane.props.position.y - scale.y / 2 < this.fullBounds.bottom) {
        velocity.y = Math.abs(velocity.y);
      }
      if (plane.props.position.y + scale.y / 2 > this.fullBounds.top) {
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

  render() {

    this.fullBounds = calculateBoundsOfAllScreenCameras(this.cameras);
    this.updateObjects();
    this.applicationSpecificRender();
      
    requestAnimationFrame(() => this.render());
  }

  applicationSpecificRender() {
  }
}

export { Application }