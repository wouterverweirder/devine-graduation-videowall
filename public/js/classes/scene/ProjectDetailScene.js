import { gsap, Power1 } from '../../gsap/src/index.js';

import { getFirstScreenCameraForRole, getScreenCamerasForRole } from "../../functions/screenUtils.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { createPlaneForScreen } from '../../functions/createPlaneForScreen.js';
import { PlaneType } from '../../consts/PlaneType.js';
import { CircleAnimationPlane } from './objects/CircleAnimationPlane.js';
import { ImagePlane } from './objects/ImagePlane.js';

class ProjectDetailScene extends SceneBase {

  constructor(id = THREE.MathUtils.generateUUID(), props = {}) {
    super(id, props);
    this.project = props.project;
  }

  async _executeStateName(stateName) {
    const project = this.project;
    console.log(`project-${project.id}: ${stateName}`);
    if (stateName === SceneState.LOAD) {
      const idPrefix = `project-${project.id}`;

      // circle animation
      const circleAnimationPlane = new CircleAnimationPlane(`circle-project-${project.id}`, {
        position: {
          x: 0,
          y: -0.5,
          z: 0.1
        },
        scale: {
          x: 0.1,
          y: 0.1
        }
      });
      await circleAnimationPlane.init();
      this.circleAnimationPlane = circleAnimationPlane;
      this.addObject(circleAnimationPlane);

      gsap.to(circleAnimationPlane, { progress: 1, duration: 1, onComplete: () => {
        this.removeObject(circleAnimationPlane);
      } });

      const createProjectPlane = async (id, screenCamera, planeType, data) => {
        if (screenCamera) {
          const screenConfig = this.screenConfigsById[screenCamera.id];
          const plane = await createPlaneForScreen({
            data: {
              id,
              type: planeType,
              anchor: {
                x: 0.5,
                y: 0
              },
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
        const screenCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.PROFILE_PICTURE);
        const screenConfig = this.screenConfigsById[screenCamera.id];

        const plane = await createPlaneForScreen({
          data: {
            id: `${idPrefix}-project-profile-picture`,
            type: PlaneType.IMAGE,
            url: project.profilePicture.url,
            fixedRepeat: {
              x: 9/16, // lock the x scale
              y: false
            },
            anchor: {
              x: 0.5,
              y: 0
            }
          },
          screenConfig
        });
        projectPlanes.push(plane);
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

    } else if (stateName === SceneState.INTRO) {

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

        // startPropValues.scale.x *= 0;
        startPropValues.position.y -= startPropValues.scale.y / 2;
        startPropValues.scale.y *= 0;

        plane.applyProps(startPropValues);

        const delay = Power1.easeInOut(index / projectPlanes.length) * maxDelay;
        tl.to(plane.props.scale, {x: endPropValues.scale.x, y: endPropValues.scale.y, ease: Power1.easeInOut, delay, duration: 1}, 0);
        tl.to(plane.props.position, {x: endPropValues.position.x, y: endPropValues.position.y, ease: Power1.easeInOut, delay, duration: 1}, 0);

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