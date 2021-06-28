import { gsap, Power1, Power4 } from '../../gsap/src/index.js';

import { DevineEasing } from '../../consts/DevineEasing.js';

import { calculateScaleForScreenConfig, doesScreenCameraHaveRole, getFirstScreenCameraForRole, getScreenCamerasForRole } from "../../functions/screenUtils.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { createPlaneForScreen } from '../../functions/createPlaneForScreen.js';
import { PlaneType } from '../../consts/PlaneType.js';
import { CircleAnimationPlane } from './objects/CircleAnimationPlane.js';
import { VisualBase } from './objects/VisualBase.js';
import { StudentNamePlane } from './objects/StudentNamePlane.js';
import { ImagePlane } from './objects/ImagePlane.js';
import { PlaneSlider } from './PlaneSlider.js';
import { delay } from '../../functions/delay.js';

class ProjectDetailScene extends SceneBase {

  planeSliders = [];
  projectPlanes = [];
  colorPlanes = [];
  profilePicturePlane = false;
  studentNamePlane = false;
  tl = false;

  portraitScreenshots = [];
  landscapeScreenshots = [];
  videos = [];

  allPortraitScreenshotPlanes = [];
  nonVisiblePortraitScreenshotPlanes = [];
  visiblePortraitScreenshotPlanes = [];
  portraitPlaneSlider = false;

  allLandscapeScreenshotPlanes = [];
  nonVisibleLandscapeScreenshotPlanes = [];
  visibleLandscapeScreenshotPlanes = [];
  landscapePlaneSlider = false;

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

      // 
      this.portraitScreenshots = project.assets.filter(asset => {
        if (asset.mime.indexOf('image') === -1) {
          return false;
        }
        return asset.width < asset.height;
      });
      this.landscapeScreenshots = project.assets.filter(asset => {
        if (asset.mime.indexOf('image') === -1) {
          return false;
        }
        return asset.width > asset.height;
      });
      this.videos = project.assets.filter(asset => {
        return (asset.mime.indexOf('video') === 0);
      });

      const profilePictureCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.PROFILE_PICTURE);
      const portraitScreenshotScreenCameras = getScreenCamerasForRole(this.cameras, ScreenRole.PORTRAIT_SCREENSHOTS);
      const landscapeScreenshotScreenCameras = getScreenCamerasForRole(this.cameras, ScreenRole.LANDSCAPE_SCREENSHOTS);
      const videoScreenCameras = getScreenCamerasForRole(this.cameras, ScreenRole.VIDEOS);

      const assetsperCameraId = {};
      for (const screenCamera of this.cameras) {
        assetsperCameraId[screenCamera.id] = [];
      }
      portraitScreenshotScreenCameras.forEach((screenCamera, cameraIndex) => {
        this.portraitScreenshots.forEach((asset, assetIndex) => {
          if (assetIndex % portraitScreenshotScreenCameras.length === cameraIndex) {
            assetsperCameraId[screenCamera.id].push(asset);
          }
        });
      });
      landscapeScreenshotScreenCameras.forEach((screenCamera, cameraIndex) => {
        this.landscapeScreenshots.forEach((asset, assetIndex) => {
          if (assetIndex % landscapeScreenshotScreenCameras.length === cameraIndex) {
            assetsperCameraId[screenCamera.id].push(asset);
          }
        });
      });
      videoScreenCameras.forEach((screenCamera, cameraIndex) => {
        this.videos.forEach((asset, assetIndex) => {
          if (assetIndex % videoScreenCameras.length === cameraIndex) {
            assetsperCameraId[screenCamera.id].push(asset);
          }
        });
      });


      // create a plane for portrait screenshots
      for (let index = 0; index < this.portraitScreenshots.length; index++) {
        const portraitScreenshot = this.portraitScreenshots[index];
        const props = {
          name: `project-asset-${project.id}-${index}`,
          textureSize: {
            x: 1080,
            y: 1920
          },
          url: portraitScreenshot.url
        };
        const plane = new ImagePlane(props.name, props);
        await plane.init();
        this.allPortraitScreenshotPlanes.push(plane);
        this.nonVisiblePortraitScreenshotPlanes.push(plane);
      }
      // create a plane for landscape screenshots
      for (let index = 0; index < this.landscapeScreenshots.length; index++) {
        const landscapeScreenshot = this.landscapeScreenshots[index];
        const props = {
          name: `project-asset-${project.id}-${index}`,
          textureSize: {
            x: 1920,
            y: 1080
          },
          url: landscapeScreenshot.url
        };
        const plane = new ImagePlane(props.name, props);
        await plane.init();
        this.allLandscapeScreenshotPlanes.push(plane);
        this.nonVisibleLandscapeScreenshotPlanes.push(plane);
      }

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
                type: PlaneType.VIDEO,
                url: project.mainAsset.url,
                layers: screenCamera.props.layers,
                muted: false
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
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PORTRAIT_SCREENSHOTS)) {
          if (this.nonVisiblePortraitScreenshotPlanes.length > 0) {
            projectPlane = this.nonVisiblePortraitScreenshotPlanes.shift();
            projectPlane.applyProps(this.generatePropsForScreen(screenCamera));
            projectPlane.customData.camera = screenCamera;
            this.visiblePortraitScreenshotPlanes.push(projectPlane);
          }      
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.LANDSCAPE_SCREENSHOTS)) {
          if (this.nonVisibleLandscapeScreenshotPlanes.length > 0) {
            projectPlane = this.nonVisibleLandscapeScreenshotPlanes.shift();
            projectPlane.applyProps(this.generatePropsForScreen(screenCamera));
            projectPlane.customData.camera = screenCamera;
            this.visibleLandscapeScreenshotPlanes.push(projectPlane);
          }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.VIDEOS)) {
          if (assetsperCameraId[screenCamera.id].length > 0) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-assets-${screenCamera.id}`,
                type: PlaneType.VIDEO,
                url: assetsperCameraId[screenCamera.id][0].url,
                layers: screenCamera.props.layers
              },
              screenConfig
            }); 
          } else {
            // no videos - take landscape screenshots
            console.log('no videos, take landscape screenshot');
            if (this.nonVisibleLandscapeScreenshotPlanes.length > 0) {
              projectPlane = this.nonVisibleLandscapeScreenshotPlanes.shift();
              projectPlane.applyProps(this.generatePropsForScreen(screenCamera));
              projectPlane.customData.camera = screenCamera;
            }
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

      const maxDelay = 0.5;
      const introColorPlaneDuration = 0.5;
      const outroColorPlaneDuration = 0.5;
      const introProjectPlaneDuration = 1.0;
      colorPlanes.forEach((colorPlane, index) => {
        const projectPlane = this.projectPlanes[index];
        if (!projectPlane) {
          // when tabbing through the project really fast, we might not have created the project plane yet
          console.log(`no project plane for index ${index}`);
          return;
        }

        const colorPlaneIntroDelay = Power4.easeOut(index / projectPlanes.length) * maxDelay;
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
  
          this.tl.to(colorPlane.props.scale, {x: middlePropValues.scale.x, y: middlePropValues.scale.y, ease: DevineEasing.COLOR_PLANE, delay: colorPlaneIntroDelay, duration: introColorPlaneDuration}, 0);
          this.tl.to(colorPlane.props.position, {x: middlePropValues.position.x, y: middlePropValues.position.y, ease: DevineEasing.COLOR_PLANE, delay: colorPlaneIntroDelay, duration: introColorPlaneDuration}, 0);
  
          // add the project plane once the color plane has full scale
          this.tl.add(() => {
            this.addObject(projectPlane);
            if (projectPlane === this.profilePicturePlane) {
              this.addObject(this.studentNamePlane);
            }
            projectPlane.intro();
          }, projectPlaneIntroDelay);
  
          // outro color plane
          this.tl.to(colorPlane.props.scale, {x: endPropValues.scale.x, y: endPropValues.scale.y, ease: DevineEasing.COLOR_PLANE, delay: projectPlaneIntroDelay, duration: outroColorPlaneDuration}, 0);
          this.tl.to(colorPlane.props.position, {x: endPropValues.position.x, y: endPropValues.position.y, ease: DevineEasing.COLOR_PLANE, delay: projectPlaneIntroDelay, duration: outroColorPlaneDuration}, 0);
        }
        {
          // intro project plane
          const startPropValues = JSON.parse(JSON.stringify(projectPlane.props));
          const endPropValues = JSON.parse(JSON.stringify(projectPlane.props));

          // startPropValues.scale.x *= 0;
          startPropValues.position.y -= .2;

          projectPlane.applyProps(startPropValues);

          this.tl.to(projectPlane.props.position, {x: endPropValues.position.x, y: endPropValues.position.y, ease: Power4.easeOut, delay: projectPlaneIntroDelay, duration: introProjectPlaneDuration}, 0);
        }
        if (projectPlane === this.profilePicturePlane) {
          // schedule the name animation as well
          const endPropValues = JSON.parse(JSON.stringify(this.studentNamePlane.props));
          const startPropValues = JSON.parse(JSON.stringify(this.studentNamePlane.props));

          startPropValues.position.y -= .1;
          this.studentNamePlane.applyProps(startPropValues);

          this.tl.to(this.studentNamePlane.props.position, {y: endPropValues.position.y, ease: Power4.easeOut, delay: projectPlaneIntroDelay, duration: introProjectPlaneDuration}, 0);
        }

        this.addObject(colorPlane);
      });

      this.landscapePlaneSlider = new PlaneSlider();
      this.landscapePlaneSlider.start({
        addObject: (o) => {
          this.addObject(o);
          this.visibleLandscapeScreenshotPlanes.push(o);
        },
        removeObject: (o) => {
          const indexToRemove = this.visibleLandscapeScreenshotPlanes.indexOf(o);
          if (indexToRemove >= this.visibleLandscapeScreenshotPlanes.length) {
            return;
          }
          this.visibleLandscapeScreenshotPlanes.splice(indexToRemove, 1);
          this.removeObject(o);
          this.nonVisibleLandscapeScreenshotPlanes.push(o);
        },
        getNewPlane: ({ oldPlane }) => {
          const newPlane = this.nonVisibleLandscapeScreenshotPlanes.shift();
          if (!newPlane) {
            return null;
          }
          const setPropsNewPlane = this.generatePropsForScreen(oldPlane.customData.camera);
          newPlane.customData.camera = oldPlane.customData.camera;
          newPlane.applyProps(setPropsNewPlane);
          return newPlane;
        },
        getOldPlane: () => {
          // choose a random item to replace
          const index = Math.floor(Math.random() * this.visibleLandscapeScreenshotPlanes.length);
          if (index >= this.visibleLandscapeScreenshotPlanes.length) {
            return;
          }
          return this.visibleLandscapeScreenshotPlanes[index];
        },
        getAxis: ({ oldPlane, newPlane }) => {
          const camera = oldPlane.customData.camera;
          const isLandscape = !(camera.props.rotation.z !== 0);
          return (isLandscape) ? 'vertical' : 'horizontal';
        },
        getDirection: ({ oldPlane, newPlane }) => -1,
        getDelayForNextAnimation: () => this.config.scenes.projectDetail.screenshotSlideInterval,
        getSlideDuration: () => 1
      });

      this.portraitPlaneSlider = new PlaneSlider();
      this.portraitPlaneSlider.start({
        addObject: (o) => {
          this.addObject(o);
          this.visiblePortraitScreenshotPlanes.push(o);
        },
        removeObject: (o) => {
          const indexToRemove = this.visiblePortraitScreenshotPlanes.indexOf(o);
          if (indexToRemove >= this.visiblePortraitScreenshotPlanes.length) {
            return;
          }
          this.visiblePortraitScreenshotPlanes.splice(indexToRemove, 1);
          this.removeObject(o);
          this.nonVisiblePortraitScreenshotPlanes.push(o);
        },
        getNewPlane: ({ oldPlane }) => {
          const newPlane = this.nonVisiblePortraitScreenshotPlanes.shift();
          const setPropsNewPlane = this.generatePropsForScreen(oldPlane.customData.camera);
          newPlane.customData.camera = oldPlane.customData.camera;
          newPlane.applyProps(setPropsNewPlane);
          return newPlane;
        },
        getOldPlane: () => {
          // choose a random item to replace
          const index = Math.floor(Math.random() * this.visiblePortraitScreenshotPlanes.length);
          if (index >= this.visiblePortraitScreenshotPlanes.length) {
            return;
          }
          return this.visiblePortraitScreenshotPlanes[index];
        },
        getAxis: ({ oldPlane, newPlane }) => {
          const camera = oldPlane.customData.camera;
          const isPortrait = !(camera.props.rotation.z !== 0);
          return (isPortrait) ? 'vertical' : 'horizontal';
        },
        getDirection: ({ oldPlane, newPlane }) => -1,
        getDelayForNextAnimation: () => this.config.scenes.projectDetail.screenshotSlideInterval,
        getSlideDuration: () => 1,
        getSlideDelay: () => this.config.scenes.projectDetail.screenshotSlideInterval / 2000
      });

    } else if (stateName === SceneState.OUTRO) {

      if (this.tl) {
        this.tl.kill();
      }

      if (this.portraitPlaneSlider) {
        this.portraitPlaneSlider.stop();
      }
      if (this.landscapePlaneSlider) {
        this.landscapePlaneSlider.stop();
      }

      await delay(1000);

      this.colorPlanes.forEach(plane => {
        this.removeObject(plane);
      });

      this.projectPlanes.forEach(plane => {
        this.removeObject(plane);
      });

      this.visiblePortraitScreenshotPlanes.forEach(plane => {
        if (this.projectPlanes.includes(plane)) {
          return;
        }
        this.removeObject(plane);
      });

      this.visibleLandscapeScreenshotPlanes.forEach(plane => {
        if (this.projectPlanes.includes(plane)) {
          return;
        }
        this.removeObject(plane);
      });

      this.removeObject(this.studentNamePlane);
    }
  }

  generatePropsForScreen(camera) {
    const screenConfig = this.screenConfigsById[camera.id];
    const screenScale = calculateScaleForScreenConfig(screenConfig);
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
    return {
      layers,
      position,
      scale
    };
  };
}

export { ProjectDetailScene }