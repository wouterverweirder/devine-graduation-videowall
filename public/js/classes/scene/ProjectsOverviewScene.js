import { gsap, Power1 } from '../../gsap/src/index.js';

import { getScreenCamerasForRoles, calculateScaleForScreenConfig } from "../../functions/screenUtils.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { ImagePlane } from './objects/ImagePlane.js';

class ProjectsOverviewScene extends SceneBase {

  allProjectPlanes = [];
  nonVisiblePlanes = [];
  visiblePlanes = [];
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

      // start the animation timeout
      this.scheduleAnimationTimeout();

    } else if (stateName === SceneState.OUTRO) {
      this.killAnimationTimeout();
      this.visiblePlanes.forEach(plane => {
        this.removeObject(plane);
      });
    }
  }

  generatePropsForScreen = (camera, isFirstItemOnScreen) => {
    const screenConfig = this.screenConfigsById[camera.id];
    const screenScale = calculateScaleForScreenConfig(screenConfig);
    const isLandscape = !(camera.props.rotation.z !== 0);
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
    const fixedRepeat = {
      x: 16/9/2,
      y: 16/9/2
    };
    if (isLandscape) {
      scale.x *= .5;
      position.x += isFirstItemOnScreen ? -scale.x/2 : scale.x/2;
      fixedRepeat.y = false;
      anchor.y = (Math.random() < .5) ? 1 : 0;
    } else {
      scale.y *= .5;
      position.y += isFirstItemOnScreen ? -scale.y/2 : scale.y/2;
      fixedRepeat.x = false;
      anchor.x = (Math.random() < .5) ? 1 : 0;
    }
    return {
      position,
      scale,
      fixedRepeat,
      anchor
    };
  };

  killAnimationTimeout = () => {
    clearTimeout(this.animationTimeoutId);
  };

  scheduleAnimationTimeout = () => {
    console.log(this.config.scenes.projectsOverview.updateInterval);
    this.killAnimationTimeout();
    this.animationTimeoutId = setTimeout(() => {
      this.animationTimeoutCb();
    }, this.config.scenes.projectsOverview.updateInterval);
  };

  animationTimeoutCb = () => {
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
      },
      scale: {
        x: oldPlane.props.scale.x,
        y: oldPlane.props.scale.y,
      },
    };
    const setPropsOldPlane = {
      anchor: {
        x: 0.5,
        y: 0.5
      }
    };
    const setPropsNewPlane = this.generatePropsForScreen(camera, newPlane.customData.isFirstItemOnScreen);
    const targetPropsNewPlane = JSON.parse(JSON.stringify(setPropsNewPlane));

    const slideDuration = 2;
    if (isLandscape) {
      targetPropsOldPlane.scale.y = 0;
      if (setPropsNewPlane.anchor.y < .5) {
        setPropsOldPlane.anchor.y = 1;
        targetPropsOldPlane.position.y += oldPlane.props.scale.y / 2;
        setPropsNewPlane.position.y -= setPropsNewPlane.scale.y / 2;
      } else {
        setPropsOldPlane.anchor.y = 0;
        targetPropsOldPlane.position.y -= oldPlane.props.scale.y / 2;
        setPropsNewPlane.position.y += setPropsNewPlane.scale.y / 2;
      }
      setPropsNewPlane.scale.y = 0;
    } else {
      targetPropsOldPlane.scale.x = 0;
      if (setPropsNewPlane.anchor.x < .5) {
        setPropsOldPlane.anchor.x = 1;
        targetPropsOldPlane.position.x -= oldPlane.props.scale.x / 2;
        setPropsNewPlane.position.x += setPropsNewPlane.scale.x / 2;
      } else {
        setPropsOldPlane.anchor.x = 0;
        targetPropsOldPlane.position.x += oldPlane.props.scale.x / 2;
        setPropsNewPlane.position.x -= setPropsNewPlane.scale.x / 2;
      }
      setPropsNewPlane.scale.x = 0;
    }
    oldPlane.applyProps(setPropsOldPlane);
    newPlane.applyProps(setPropsNewPlane);

    tl.to(oldPlane.props.scale, {...targetPropsOldPlane.scale, duration: slideDuration, ease: Power1.easeInOut}, 0);
    tl.to(oldPlane.props.position, {...targetPropsOldPlane.position, duration: slideDuration, ease: Power1.easeInOut}, 0);

    tl.to(newPlane.props.scale, {...targetPropsNewPlane.scale, duration: slideDuration, ease: Power1.easeInOut}, 0);
    tl.to(newPlane.props.position, {...targetPropsNewPlane.position, duration: slideDuration, ease: Power1.easeInOut}, 0);

    this.visiblePlanes.push(newPlane);
    this.addObject(newPlane);

    this.scheduleAnimationTimeout();
  };
}

export { ProjectsOverviewScene }