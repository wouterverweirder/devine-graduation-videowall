import { ServerConnection } from './ServerConnection.js';
import { createCamerasForConfig, calculateBoundsOfAllScreenCameras, getFirstScreenCameraForRole } from '../functions/screenUtils.js';
import { createPlaneForScreen } from '../functions/createPlaneForScreen.js';
import { ScreenRole } from '../consts/ScreenRole.js';
import { ProjectsOverviewScene } from './scene/ProjectsOverviewScene.js';
import { ProjectDetailScene } from './scene/ProjectDetailScene.js';
import { SceneState } from './scene/SceneBase.js';

class Application {

  config;
  renderer;
  scene;
  visibleScenes = [];
  cameras;
  screenConfigsById = {};
  camerasById = {};
  objects = [];
  serverConnection = new ServerConnection();
  projects;
  students;

  constructor(config) {
    this.config = config;
  }

  async init() {
    const apiProjects = await this.fetchProjects();
    this.projects = apiProjects.data.projects.data;
    this.students = [];
    this.projects.forEach(project => {
      project.attributes.students.data.forEach(student => {
        this.students.push(student);
      });
    });

    // get the cli args
    const apiArgv = await (await fetch(`${this.getServerPath()}/api/argv`)).json();
    this.argv = apiArgv.data;
    
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

    if (this.argv['no-websocket']) {
      this.onRequestShowProjectsOverview();
      // keyboard interaction
      let currentProjectIndex = -1
      document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
          currentProjectIndex++;
          if (currentProjectIndex >= this.projects.length) {
            currentProjectIndex = 0;
          }
          this.onRequestShowProject(this.projects[currentProjectIndex]);
        }
      });
    } else {
      this.connectToServer();
    }

    requestAnimationFrame(() => this.render());
  }

  async fetchProjects() {
    const query = `query{
      projects{
        data {
          id,
          attributes {
            Name,
            description,
            mainAsset {
              data {
                id,
                attributes {
                  url,
                  width,
                  height,
                  mime
                }
              }
            },
            assets {
              data {
                id,
                attributes {
                  url,
                  width,
                  height,
                  mime
                }
              }
            },
            students {
              data {
                id,
                attributes {
                  firstName,
                  lastName,
                  expert {
                    data {
                      id,
                      attributes {
                        name
                      }
                    }
                  },
                  bio,
                  profilePicture {
                    data {
                      id,
                      attributes {
                        url,
                        width,
                        height,
                        mime
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;
    return await (await fetch(`${this.getServerPath()}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
        },
      }),
    })).json();
  }

  getServerPath() {
    if (window.location.protocol === 'http:') {
      return '';
    }
    return `http://${this.getServerAddress()}`;
  }

  getServerAddress() {
    if (window.location.protocol === 'http:') {
      return window.location.domain;
    }
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

  addObject(object) {
    this.objects.push(object);
    this.onSceneObjectAdded(object);
  }

  removeObject(object) {
    let index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
    this.onSceneObjectRemoved(object);
    if (object.dispose) {
      object.dispose();
    }
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
    this.addObject(plane);
  }

  async onRequestRemoveObject (data) {
    let applicableObjects = this.objects.filter(object => {
      return object.id === data.id
    });
    applicableObjects.forEach(object => {
      this.removeObject(object);
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
  }

  async onRequestShowProjectsOverview () {
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
      projects: this.projects,
      students: this.students,
      addObject: this.addObject.bind(this),
      removeObject: this.removeObject.bind(this)
    });

    scene.animateToStateName(SceneState.PLAYING);
    this.visibleScenes.push(scene);
  }

  async onRequestShowProject(project) {
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
      projects: this.projects,
      students: this.students,
      addObject: this.addObject.bind(this),
      removeObject: this.removeObject.bind(this),
      project
    });

    scene.animateToStateName(SceneState.PLAYING);
    this.visibleScenes.push(scene);
  }

  async onRequestKeyPressed(event) {
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