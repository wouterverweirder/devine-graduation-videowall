import { gsap, Power1 } from '../../gsap/src/index.js';

import { getScreenCamerasForRoles, calculateScaleForScreenConfig, getFirstScreenCameraForRole } from "../../functions/screenUtils.js";
import { createPlaneForScreen } from "../../functions/createPlaneForScreen.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { ImagePlane } from './objects/ImagePlane.js';
import { delay } from '../../functions/delay.js';
import { DevineInfoPlane } from './objects/DevineInfoPlane.js';
import { PlaneType } from '../../consts/PlaneType.js';

class ProjectsOverviewScene extends SceneBase {

  allProjectPlanes = [];
  nonVisiblePlanes = [];
  visiblePlanes = [];
  devineInfoPlane = false;
  animationTimeoutId = false;

  async _executeStateName(stateName) {
    if (stateName === SceneState.LOAD) {

      // create a plane for each project
      for (let index = 0; index < this.projects.length; index++) {
        const project = this.projects[index];
        const props = {
          name: `project-overview-${project.id}-${index}`,
          textureSize: {
            x: 1920,
            y: 1920
          },
          url: project.profilePicture.url
        };
        const plane = new ImagePlane(props.name, props);
        await plane.init();
        this.allProjectPlanes.push(plane);
        this.nonVisiblePlanes.push(plane);
      }
      // create the devine info plane
      const mainCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.MAIN_VIDEO);
      const screenConfig = this.screenConfigsById[mainCamera.id];
      this.devineInfoPlane = await createPlaneForScreen({
        data: {
          id: 'devine-info',
          type: PlaneType.DEVINE_INFO
        },
        screenConfig
      });

    } else if (stateName === SceneState.INTRO) {
      const cameras = getScreenCamerasForRoles(this.cameras, [
        ScreenRole.PROFILE_PICTURE,
        ScreenRole.PROJECT_BIO,
        ScreenRole.PROJECT_DESCRIPTION,
        ScreenRole.PORTRAIT_SCREENSHOTS,
        ScreenRole.LANDSCAPE_SCREENSHOTS,
        ScreenRole.VIDEOS,
      ]);
      // add two planes per camera
      for (const camera of cameras) {
        for (let i = 0; i < 2; i++) {
          if (this.nonVisiblePlanes.length === 0) {
            break;
          }
          const isFirstItemOnScreen = (i === 0);
          const plane = this.nonVisiblePlanes.shift();
          plane.applyProps(this.generatePropsForScreen(camera, isFirstItemOnScreen));
          plane.customData.camera = camera;
          plane.customData.isFirstItemOnScreen = isFirstItemOnScreen;
          this.visiblePlanes.push(plane);
        }
      }

      this.visiblePlanes.forEach(plane => {
        this.addObject(plane);
      });

      this.addObject(this.devineInfoPlane);
      this.devineInfoPlane.intro();

      // start the animation timeout
      this.scheduleAnimationTimeout();

    } else if (stateName === SceneState.OUTRO) {
      this.killAnimationTimeout();

      await delay(1000);

      this.visiblePlanes.forEach(plane => {
        this.removeObject(plane);
      });

      this.removeObject(this.devineInfoPlane);
    }
  }

  generatePropsForScreen(camera, isFirstItemOnScreen) {
    const screenConfig = this.screenConfigsById[camera.id];
    const screenScale = calculateScaleForScreenConfig(screenConfig);
    const isLandscape = !(camera.props.rotation.z !== 0);
    const layers = (camera.props.layers) ? camera.props.layers.concat() : false;
    const position = {
      x: screenConfig.camera.position[0],
      y: screenConfig.camera.position[1],
      z: 0
    };
    const scale = {
      x: screenScale.x,
      y: screenScale.y
    };
    const anchor = {
      x: 0.5,
      y: 0.5
    };
    if (isLandscape) {
      scale.x *= .5;
      position.x += isFirstItemOnScreen ? -scale.x/2 : scale.x/2;
      anchor.y = (Math.random() < .5) ? 1 : 0;
    } else {
      scale.y *= .5;
      position.y += isFirstItemOnScreen ? -scale.y/2 : scale.y/2;
      anchor.x = (Math.random() < .5) ? 1 : 0;
    }
    return {
      layers,
      position,
      scale,
      anchor
    };
  };

  killAnimationTimeout() {
    clearTimeout(this.animationTimeoutId);
  };

  scheduleAnimationTimeout() {
    console.log(this.config.scenes.projectsOverview.updateInterval);
    this.killAnimationTimeout();
    this.animationTimeoutId = setTimeout(() => {
      this.animationTimeoutCb();
    }, this.config.scenes.projectsOverview.updateInterval);
  };

  animationTimeoutCb() {
    if (this.nonVisiblePlanes.length === 0) {
      return;
    }
    // choose a random item to replace
    const index = Math.floor(Math.random() * this.visiblePlanes.length);
    if (index >= this.visiblePlanes.length) {
      return;
    }
    const oldPlane = this.visiblePlanes[index];
    const newPlane = this.nonVisiblePlanes.shift();
    newPlane.customData.camera = oldPlane.customData.camera;
    newPlane.customData.isFirstItemOnScreen = oldPlane.customData.isFirstItemOnScreen;
    const camera = oldPlane.customData.camera;
    const isLandscape = !(camera.props.rotation.z !== 0);
    // animate
    console.log(oldPlane.props);
    const tl = gsap.timeline({
      onUpdate: () => {
        oldPlane.applyProps(oldPlane.props);
        newPlane.applyProps(newPlane.props);
      },
      onComplete: () => {
        const indexToRemove = this.visiblePlanes.indexOf(oldPlane);
        if (indexToRemove >= this.visiblePlanes.length) {
          return;
        }
        this.visiblePlanes.splice(indexToRemove, 1);
        this.removeObject(oldPlane);
        this.nonVisiblePlanes.push(oldPlane);
      }
    });
    const targetPropsOldPlane = {
      position: {
        x: oldPlane.props.position.x,
        y: oldPlane.props.position.y,
      }
    };
    const setPropsOldPlane = {};
    const setPropsNewPlane = this.generatePropsForScreen(camera, newPlane.customData.isFirstItemOnScreen);
    const targetPropsNewPlane = JSON.parse(JSON.stringify(setPropsNewPlane));

    const slideDuration = 1;
    if (isLandscape) {
      if (setPropsNewPlane.anchor.y < .5) {
        targetPropsOldPlane.position.y += oldPlane.props.scale.y;
        setPropsNewPlane.position.y -= setPropsNewPlane.scale.y;
      } else {
        targetPropsOldPlane.position.y -= oldPlane.props.scale.y;
        setPropsNewPlane.position.y += setPropsNewPlane.scale.y;
      }
    } else {
      if (setPropsNewPlane.anchor.x < .5) {
        targetPropsOldPlane.position.x -= oldPlane.props.scale.x;
        setPropsNewPlane.position.x += setPropsNewPlane.scale.x;
      } else {
        targetPropsOldPlane.position.x += oldPlane.props.scale.x;
        setPropsNewPlane.position.x -= setPropsNewPlane.scale.x;
      }
    }
    oldPlane.applyProps(setPropsOldPlane);
    newPlane.applyProps(setPropsNewPlane);

    tl.to(oldPlane.props.position, {...targetPropsOldPlane.position, duration: slideDuration, ease: Power1.easeInOut}, 0);
    tl.to(newPlane.props.position, {...targetPropsNewPlane.position, duration: slideDuration, ease: Power1.easeInOut}, 0);

    this.visiblePlanes.push(newPlane);
    this.addObject(newPlane);

    this.scheduleAnimationTimeout();
  };
}

export { ProjectsOverviewScene }