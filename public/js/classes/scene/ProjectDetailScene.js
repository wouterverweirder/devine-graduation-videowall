import { gsap, Power4 } from '../../gsap/src/index.js';

import { calculateScaleForScreenConfig, doesScreenCameraHaveRole, getFirstScreenCameraForRole, getScreenCamerasForRole } from "../../functions/screenUtils.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { createPlaneForScreen } from '../../functions/createPlaneForScreen.js';
import { PlaneType } from '../../consts/PlaneType.js';
import { CircleAnimationPlane } from './objects/CircleAnimationPlane.js';
import { VisualBase } from './objects/VisualBase.js';
import { StudentNamePlane } from './objects/StudentNamePlane.js';

class ProjectDetailScene extends SceneBase {

  projectPlanes = [];
  colorPlanes = [];
  profilePicturePlane = false;
  studentNamePlane = false;
  tl = false;

  constructor(id = THREE.MathUtils.generateUUID(), props = {}) {
    super(id, props);
    this.project = props.project;

    // sort cameras from bottom to top
    this.camerasFromBottomToTop = this.cameras.sort((a, b) => {
      return (a.props.position.y < b.props.position.y) ? -1 : 1;
    });
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
      const profilePictureCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.PROFILE_PICTURE);
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

      {
        const screenConfig = this.screenConfigsById[profilePictureCamera.id];
        const screenScale = calculateScaleForScreenConfig(screenConfig);
        const scale = {...screenScale};
        scale.y *= (280 / 1920);
        this.studentNamePlane = new StudentNamePlane(`student-name-${project.id}`, {
          position: {
            x: screenConfig.camera.position[0],
            y: screenConfig.camera.position[1] - (screenScale.y / 2 - scale.y / 2),
            z: -0.1
          },
          scale,
          textureSize: {
            x: 1080,
            y: 280,
          },
          data: project
        });
        await this.studentNamePlane.init();
      }

      for (const screenCamera of this.camerasFromBottomToTop) {
        const screenConfig = this.screenConfigsById[screenCamera.id];
        const colorPlane = await createPlaneForScreen({
          data: {
            id: `${idPrefix}-color-${screenCamera.id}`,
            color: 0xffffff,
            position: {
              z: 0.1
            },
            layers: screenCamera.props.layers
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
                data: [project.mainAsset],
                layers: screenCamera.props.layers
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
                layers: screenCamera.props.layers
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
                data: assetsperCameraId[screenCamera.id],
                layers: screenCamera.props.layers
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
                data: project,
                layers: screenCamera.props.layers
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
                data: project,
                layers: screenCamera.props.layers
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
              color: 0x000000,
              layers: screenCamera.props.layers
            },
            screenConfig
          });
        }

        if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROFILE_PICTURE)) {
          this.profilePicturePlane = projectPlane;
          // profile picture is less high
          this.profilePicturePlane.applyProps({
            position: {
              x: this.profilePicturePlane.props.position.x,
              y: this.profilePicturePlane.props.position.y + (this.studentNamePlane.props.scale.y / 2),
              z: this.profilePicturePlane.props.position.z
            },
            scale: {
              x: this.profilePicturePlane.props.scale.x,
              y: this.profilePicturePlane.props.scale.y - this.studentNamePlane.props.scale.y
            }
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
          colorPlanes.forEach(plane => {
            const props = {
              scale: plane.props.scale,
              position: plane.props.position,
            };
            plane.applyProps(props)
          });
          projectPlanes.forEach(plane => {
            const props = {
              position: plane.props.position,
            };
            plane.applyProps(props)
          });
          this.studentNamePlane.applyProps({
            position: {
              x: this.studentNamePlane.props.position.x,
              y: this.studentNamePlane.props.position.y,
              z: this.studentNamePlane.props.position.z,
            }
          });
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

        const colorPlaneIntroDelay = Power4.easeInOut(index / projectPlanes.length) * maxDelay;
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
  
          this.tl.to(colorPlane.props.scale, {x: middlePropValues.scale.x, y: middlePropValues.scale.y, ease: Power4.easeInOut, delay: colorPlaneIntroDelay, duration: introColorPlaneDuration}, 0);
          this.tl.to(colorPlane.props.position, {x: middlePropValues.position.x, y: middlePropValues.position.y, ease: Power4.easeInOut, delay: colorPlaneIntroDelay, duration: introColorPlaneDuration}, 0);
  
          // add the project plane once the color plane has full scale
          this.tl.add(() => {
            this.addObject(projectPlane);
            if (projectPlane === this.profilePicturePlane) {
              this.addObject(this.studentNamePlane);
            }
            projectPlane.intro();
          }, projectPlaneIntroDelay);
  
          // outro color plane
          this.tl.to(colorPlane.props.scale, {x: endPropValues.scale.x, y: endPropValues.scale.y, ease: Power4.easeInOut, delay: projectPlaneIntroDelay, duration: outroColorPlaneDuration}, 0);
          this.tl.to(colorPlane.props.position, {x: endPropValues.position.x, y: endPropValues.position.y, ease: Power4.easeInOut, delay: projectPlaneIntroDelay, duration: outroColorPlaneDuration}, 0);
        }
        {
          // intro project plane
          const startPropValues = JSON.parse(JSON.stringify(projectPlane.props));
          const endPropValues = JSON.parse(JSON.stringify(projectPlane.props));

          // startPropValues.scale.x *= 0;
          startPropValues.position.y -= .2;

          projectPlane.applyProps(startPropValues);

          this.tl.to(projectPlane.props.position, {x: endPropValues.position.x, y: endPropValues.position.y, ease: Power4.easeInOut, delay: projectPlaneIntroDelay, duration: introProjectPlaneDuration}, 0);
        }
        if (projectPlane === this.profilePicturePlane) {
          // schedule the name animation as well
          const endPropValues = JSON.parse(JSON.stringify(this.studentNamePlane.props));
          const startPropValues = JSON.parse(JSON.stringify(this.studentNamePlane.props));

          startPropValues.position.y -= .1;
          this.studentNamePlane.applyProps(startPropValues);

          this.tl.to(this.studentNamePlane.props.position, {y: endPropValues.position.y, ease: Power4.easeInOut, delay: projectPlaneIntroDelay, duration: introProjectPlaneDuration}, 0);
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

      this.removeObject(this.studentNamePlane);
    }
  }
}

export { ProjectDetailScene }