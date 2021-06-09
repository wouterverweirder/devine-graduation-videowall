import { gsap, Power1 } from '../../gsap/src/index.js';

import { doesScreenCameraHaveRole, getScreenCamerasForRole } from "../../functions/screenUtils.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { createPlaneForScreen } from '../../functions/createPlaneForScreen.js';
import { PlaneType } from '../../consts/PlaneType.js';
import { CircleAnimationPlane } from './objects/CircleAnimationPlane.js';
import { VisualBase } from './objects/VisualBase.js';

class ProjectDetailScene extends SceneBase {

  projectPlanes = [];
  colorPlanes = [];
  tl = false;

  constructor(id = THREE.MathUtils.generateUUID(), props = {}) {
    super(id, props);
    this.project = props.project;
  }

  async _executeStateName(stateName) {
    const project = this.project;
    console.log(`project-${project.id}: ${stateName}`);
    if (stateName === SceneState.LOAD) {
      const idPrefix = `project-${project.id}`;

      // create planes per screen
      this.colorPlanes = [];
      this.projectPlanes = [];

      // assets
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
      const videos = project.assets.filter(asset => {
        return (asset.mime.indexOf('video') === 0);
      });
      // divide assets over screens
      const portraitScreenshotScreenCameras = getScreenCamerasForRole(this.cameras, ScreenRole.PORTRAIT_SCREENSHOTS);
      const landscapeScreenshotScreenCameras = getScreenCamerasForRole(this.cameras, ScreenRole.LANDSCAPE_SCREENSHOTS);
      const videoScreenCameras = getScreenCamerasForRole(this.cameras, ScreenRole.VIDEOS);
      const assetsperCameraId = {};
      for (const screenCamera of this.cameras) {
        assetsperCameraId[screenCamera.id] = [];
      }
      portraitScreenshotScreenCameras.forEach((screenCamera, cameraIndex) => {
        portraitScreenshots.forEach((asset, assetIndex) => {
          if (assetIndex % portraitScreenshotScreenCameras.length === cameraIndex) {
            assetsperCameraId[screenCamera.id].push(asset);
          }
        });
      });
      landscapeScreenshotScreenCameras.forEach((screenCamera, cameraIndex) => {
        landscapeScreenshots.forEach((asset, assetIndex) => {
          if (assetIndex % landscapeScreenshotScreenCameras.length === cameraIndex) {
            assetsperCameraId[screenCamera.id].push(asset);
          }
        });
      });
      videoScreenCameras.forEach((screenCamera, cameraIndex) => {
        videos.forEach((asset, assetIndex) => {
          if (assetIndex % videoScreenCameras.length === cameraIndex) {
            assetsperCameraId[screenCamera.id].push(asset);
          }
        });
      });

      for (const screenCamera of this.cameras) {
        const screenConfig = this.screenConfigsById[screenCamera.id];
        const colorPlane = await createPlaneForScreen({
          data: {
            id: `${idPrefix}-color-${screenCamera.id}`,
            color: 0xffffff,
            position: {
              z: 0.1
            }
          },
          screenConfig
        });
        // offset position
        colorPlane.applyProps({
          position: {
            x: colorPlane.props.position.x,
            y: colorPlane.props.position.y - colorPlane.props.scale.y / 2,
            z: colorPlane.props.position.z
          }
        });
        this.colorPlanes.push(colorPlane);
        // what roles does this screen have?
        let projectPlane;
        if (doesScreenCameraHaveRole(screenCamera, ScreenRole.MAIN_VIDEO)) {
          if (project.mainAsset) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-main-video-${screenCamera.id}`,
                type: PlaneType.PROJECT_ASSETS,
                data: [project.mainAsset]
              },
              screenConfig
            }); 
          }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROFILE_PICTURE)) {
          if (project.profilePicture) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-profile-picture-${screenCamera.id}`,
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
          }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.LANDSCAPE_SCREENSHOTS) || doesScreenCameraHaveRole(screenCamera, ScreenRole.PORTRAIT_SCREENSHOTS) || doesScreenCameraHaveRole(screenCamera, ScreenRole.VIDEOS)) {
          if (assetsperCameraId[screenCamera.id].length > 0) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-assets-${screenCamera.id}`,
                type: PlaneType.PROJECT_ASSETS,
                data: assetsperCameraId[screenCamera.id]
              },
              screenConfig
            }); 
          }          
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROJECT_BIO)) {
          if (project.bio) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-bio-${screenCamera.id}`,
                type: PlaneType.PROJECT_BIO,
                data: project
              },
              screenConfig
            }); 
          }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROJECT_DESCRIPTION)) {
          if (project.description) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-description-${screenCamera.id}`,
                type: PlaneType.PROJECT_DESCRIPTION,
                data: project
              },
              screenConfig
            }); 
          }
        }
        if (!projectPlane) {
          // add an empty plane on the screen when we have no plane on that screen
          projectPlane = await createPlaneForScreen({
            data: {
              id: `${idPrefix}-empty-${screenCamera.id}`,
              color: 0x000000
            },
            screenConfig
          });
        }
        this.projectPlanes.push(projectPlane);
      };

      // // circle animation
      // const circleAnimationPlane = new CircleAnimationPlane(`circle-project-${project.id}`, {
      //   position: {
      //     x: 0,
      //     y: -0.5,
      //     z: 0.1
      //   },
      //   scale: {
      //     x: 0.1,
      //     y: 0.1
      //   }
      // });
      // await circleAnimationPlane.init();
      // this.circleAnimationPlane = circleAnimationPlane;
      // this.addObject(circleAnimationPlane);

      // gsap.to(circleAnimationPlane, { progress: 1, duration: 1, onComplete: () => {
      //   this.removeObject(circleAnimationPlane);
      // } });

    } else if (stateName === SceneState.INTRO) {

      const projectPlanes = this.projectPlanes;
      const colorPlanes = this.colorPlanes;

      this.tl = gsap.timeline({
        onUpdate: () => {
          colorPlanes.forEach(plane => plane.applyProps(plane.props));
          projectPlanes.forEach(plane => plane.applyProps(plane.props));
        }
      });

      const maxDelay = .5;
      const introColorPlaneDuration = .5;
      const outroColorPlaneDuration = .5;
      const introProjectPlaneDuration = .5;
      colorPlanes.forEach((colorPlane, index) => {
        const projectPlane = this.projectPlanes[index];
        if (!projectPlane) {
          // when tabbing through the project really fast, we might not have created the project plane yet
          console.log(`no project plane for index ${index}`);
          return;
        }

        const colorPlaneIntroDelay = Power1.easeInOut(index / projectPlanes.length) * maxDelay;
        const projectPlaneIntroDelay = colorPlaneIntroDelay + introColorPlaneDuration;

        {
          const startPropValues = JSON.parse(JSON.stringify(colorPlane.props));
          const middlePropValues = JSON.parse(JSON.stringify(colorPlane.props));
          const endPropValues = JSON.parse(JSON.stringify(colorPlane.props));
          
          startPropValues.scale.y *= 0;
          colorPlane.applyProps(startPropValues);
  
          // middle
          middlePropValues.position.y += middlePropValues.scale.y / 2;
  
          // end
          endPropValues.position.y += endPropValues.scale.y;
          endPropValues.scale.y *= 0;
  
          this.tl.to(colorPlane.props.scale, {x: middlePropValues.scale.x, y: middlePropValues.scale.y, ease: Power1.easeInOut, delay: colorPlaneIntroDelay, duration: introColorPlaneDuration}, 0);
          this.tl.to(colorPlane.props.position, {x: middlePropValues.position.x, y: middlePropValues.position.y, ease: Power1.easeInOut, delay: colorPlaneIntroDelay, duration: introColorPlaneDuration}, 0);
  
          // add the project plane once the color plane has full scale
          this.tl.add(() => {
            this.addObject(projectPlane);
            projectPlane.intro();
          }, projectPlaneIntroDelay);
  
          // outro color plane
          this.tl.to(colorPlane.props.scale, {x: endPropValues.scale.x, y: endPropValues.scale.y, ease: Power1.easeInOut, delay: projectPlaneIntroDelay, duration: outroColorPlaneDuration}, 0);
          this.tl.to(colorPlane.props.position, {x: endPropValues.position.x, y: endPropValues.position.y, ease: Power1.easeInOut, delay: projectPlaneIntroDelay, duration: outroColorPlaneDuration}, 0);
        }
        {
          // intro project plane
          const startPropValues = JSON.parse(JSON.stringify(projectPlane.props));
          const endPropValues = JSON.parse(JSON.stringify(projectPlane.props));

          // startPropValues.scale.x *= 0;
          startPropValues.position.y -= .2;
          startPropValues.scale.y *= 0.8;

          projectPlane.applyProps(startPropValues);

          this.tl.to(projectPlane.props.scale, {x: endPropValues.scale.x, y: endPropValues.scale.y, ease: Power1.easeInOut, delay: projectPlaneIntroDelay, duration: introProjectPlaneDuration}, 0);
          this.tl.to(projectPlane.props.position, {x: endPropValues.position.x, y: endPropValues.position.y, ease: Power1.easeInOut, delay: projectPlaneIntroDelay, duration: introProjectPlaneDuration}, 0);
        }

        this.addObject(colorPlane);
      });
    } else if (stateName === SceneState.OUTRO) {

      if (this.tl) {
        this.tl.kill();
      }

      this.colorPlanes.forEach(plane => {
        this.removeObject(plane);
      });

      this.projectPlanes.forEach(plane => {
        this.removeObject(plane);
      });
    }
  }
}

export { ProjectDetailScene }