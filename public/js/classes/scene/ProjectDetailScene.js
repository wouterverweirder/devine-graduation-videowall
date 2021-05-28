import { gsap, Power1 } from '../../gsap/src/index.js';

import { getFirstScreenCameraForRole, getScreenCamerasForRole } from "../../functions/screenUtils.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { createPlaneForScreen } from '../../functions/createPlaneForScreen.js';
import { PlaneType } from '../../consts/PlaneType.js';
import { CircleAnimationPlane } from './objects/CircleAnimationPlane.js';

class ProjectDetailScene extends SceneBase {

  constructor(id = THREE.MathUtils.generateUUID(), props = {}) {
    super(id, props);
    this.project = props.project;
  }

  async _executeStateName(stateName) {
    console.log(stateName);
    const project = this.project;
    if (stateName === SceneState.LOAD) {
      const idPrefix = `project-${project.id}`;

      // circle animation
      const circleAnimationPlane = new CircleAnimationPlane(`circle-project-${project.id}`, {
        scale: {
          x: 0.1,
          y: 0.1
        }
      });
      await circleAnimationPlane.init();
      this.circleAnimationPlane = circleAnimationPlane;
      this.addObject(circleAnimationPlane);

      const circleAnimationTimeline = gsap.to(circleAnimationPlane, { progress: 1, duration: 0.5 });

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

      this.projectPlanes = projectPlanes;

      // wait for the circle animation to finish
      await new Promise((resolve) => {
        circleAnimationTimeline.eventCallback("onComplete", () => {
          console.log('animation complete');
          resolve();
        });
      });

    } else if (stateName === SceneState.INTRO) {

      const circleAnimationPlane = this.circleAnimationPlane;
      this.removeObject(circleAnimationPlane);

      const projectPlanes = this.projectPlanes;

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

        this.addObject(plane);
      });
    } else if (stateName === SceneState.OUTRO) {

      const projectPlanes = this.projectPlanes;
      projectPlanes.forEach(plane => {
        this.removeObject(plane);
      });
    }
  }
}

export { ProjectDetailScene }