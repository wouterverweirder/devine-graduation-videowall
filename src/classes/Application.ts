import * as THREE from 'three';

import { createPlaneForScreen, CreatePlaneForScreenData } from '../functions/createPlaneForScreen';
import { fetchProjects } from '../functions/fetchProjects';
import { getValueByPath } from '../functions/getValueByPath';
import { calculateBoundsOfAllScreenCameras, createCamerasForConfig } from '../functions/screenUtils';
import { ArgV, getArgVFromQueryString } from '../options';
import { ApplicationConfig, FetchProjectsResult, Project, ScreenConfig } from '../types';
import { BouncingDVDScene } from './scene/BouncingDVDScene';
import { OptionalSceneObjectProps, SceneObject } from './scene/objects/SceneObject';
import { ScreenCamera } from './scene/objects/ScreenCamera';
import { ProjectDetailScene } from './scene/ProjectDetailScene';
import { ProjectsOverviewScene } from './scene/ProjectsOverviewScene';
import { SceneBase, SceneState } from './scene/SceneBase';
import { ServerConnection } from './ServerConnection';

class Application {

  config:ApplicationConfig;
  argv:ArgV;
  renderer:THREE.WebGLRenderer;
  scene:THREE.Scene;
  visibleScenes:SceneBase[] = [];
  activeScene:SceneBase;
  cameras: ScreenCamera[] = [];
  screenConfigsById: Record<string, ScreenConfig> = {};
  camerasById: Record<string, ScreenCamera> = {};
  objects:SceneObject[] = [];
  serverConnection = new ServerConnection();
  fetchProjectsResult:FetchProjectsResult;
  fullBounds: ReturnType<typeof calculateBoundsOfAllScreenCameras> = null;
  currentProjectIndex = -1;

  constructor(config:ApplicationConfig) {
    this.config = config;
  }

  async init() {
    // get the cli args
    // parse the querystring into this.argv using URLSearchParams
    this.argv = getArgVFromQueryString();

    this.fetchProjectsResult = await this.fetchProjects();
    
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
          } else if (parsedMessage.type === 'key-pressed') {
            await this.onRequestKeyPressed(parsedMessage.data);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (this.isControlledThroughWebsocket()) {
      this.connectToServer();
    } else {
      // keyboard interaction
      const projects = getValueByPath(this.fetchProjectsResult, this.config.data.projectsKey);
      if (Array.isArray(projects)) {
        document.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight') {
            this.currentProjectIndex++;
            if (this.currentProjectIndex >= projects.length) {
              this.currentProjectIndex = 0;
            }
            this.onRequestShowProject(projects[this.currentProjectIndex]);
          }
        });
        if (!this.hasProjectsOverview()) {
          if (projects.length > 0) {
            this.currentProjectIndex = 0;
            await this.onRequestShowProject(projects[0]);
          }
        } else {
          this.currentProjectIndex = -1
          this.onRequestShowProjectsOverview();
        }
      } else {
        console.warn('No projects found in the fetched data. Please check your configuration.');
      }
    }

    requestAnimationFrame(() => this.render());
  }

  async fetchProjects() {
    return await fetchProjects(this.argv);
  }
  
  isControlledThroughWebsocket() {
    return !!this.argv['websocket'];
  }

  setupApplicationSpecificUI() {
    // needs to be implemented by extending class if needed
  }

  onServerConnectionOpen() {
  }

  connectToServer() {
    this.serverConnection.connect(this.argv['websocket']);
  }

  addObject(object:SceneObject) {
    this.objects.push(object);
    this.onSceneObjectAdded(object);
  }

  removeObject(object:SceneObject) {
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
    this.onSceneObjectRemoved(object);
  }

  onSceneObjectAdded:(object:SceneObject) => void = () => {};

  onSceneObjectRemoved:(object:SceneObject) => void = () => {};

  onSceneObjectRender:(object:SceneObject) => void = () => {};

  onSceneObjectPropsChanged:(object:SceneObject) => void = () => {};

  async onRequestCreatePlaneOnScreen (data:CreatePlaneForScreenData) {
    const screenConfig = this.screenConfigsById[data.screenId];
    if (!screenConfig) {
      return;
    }
    const plane = await createPlaneForScreen({data, screenConfig, appConfig: this.config});
    this.addObject(plane);
  }

  async onRequestRemoveObject (data: { id: string }) {
    const applicableObjects = this.objects.filter(object => {
      return object.id === data.id
    });
    applicableObjects.forEach(object => {
      this.removeObject(object);
    });
  }

  async onRequestSetObjectProps (data: { id: string, props: OptionalSceneObjectProps }) {
    const applicableObjects = this.objects.filter(object => {
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
    while (this.visibleScenes.length > 0) {
      const visibleScene = this.visibleScenes.shift();
      visibleScene.animateToStateName(SceneState.OUTRO).then(() => {
        visibleScene.dispose();
      });
    }
    this.objects.forEach(object => {
      this.onSceneObjectRemoved(object);
      if (object.dispose) {
        object.dispose();
      }
    });
    this.objects = [];
    this.activeScene = null;
  }

  hasProjectsOverview() {
    return !(this.config.scenes.projectsOverview?.disabled);
  }

  async onRequestShowProjectsOverview () {
    if (!this.hasProjectsOverview()) {
      return;
    }
    const visibleSceneIsOverview = (this.visibleScenes.length === 1 && this.visibleScenes[0] instanceof ProjectsOverviewScene);
    if (visibleSceneIsOverview) {
      return;
    }
    while (this.visibleScenes.length > 0) {
      const visibleScene = this.visibleScenes.shift();
      visibleScene.animateToStateName(SceneState.OUTRO).then(() => {
        visibleScene.dispose();
      });
    }
    const scene = new ProjectsOverviewScene('projects-overview', {
      config: this.config,
      cameras: this.cameras,
      screenConfigsById: this.screenConfigsById,
      fetchProjectsResult: this.fetchProjectsResult,
      addObject: this.addObject.bind(this),
      removeObject: this.removeObject.bind(this)
    });

    scene.animateToStateName(SceneState.PLAYING);
    this.visibleScenes.push(scene);
    this.activeScene = scene;
  }

  async onRequestShowProject(project:Project) {
    while (this.visibleScenes.length > 0) {
      const visibleScene = this.visibleScenes.shift();
      visibleScene.animateToStateName(SceneState.OUTRO).then(() => {
        visibleScene.dispose();
      });
    }
    const scene = new ProjectDetailScene(`project-detail-${project.id}`, {
      config: this.config,
      cameras: this.cameras,
      screenConfigsById: this.screenConfigsById,
      addObject: this.addObject.bind(this),
      removeObject: this.removeObject.bind(this),
      project
    });

    scene.animateToStateName(SceneState.PLAYING);
    this.visibleScenes.push(scene);
    this.activeScene = scene;
  }

  onRequestKeyPressed:(event: { key: string }) => void = () => {};

  async onRequestShowBouncingDVDLogo() {
    const scene = new BouncingDVDScene('bouncing-dvd', {
      config: this.config,
      cameras: this.cameras,
      screenConfigsById: this.screenConfigsById,
      addObject: this.addObject.bind(this),
      removeObject: this.removeObject.bind(this)
    });
    this.visibleScenes.push(scene);
    scene.animateToStateName(SceneState.PLAYING);
  }

  updateObjects() {
    this.objects.forEach((object) => {
      this.updateObject(object);
    });
  }

  updateObject(object:SceneObject) {
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

export { Application };
