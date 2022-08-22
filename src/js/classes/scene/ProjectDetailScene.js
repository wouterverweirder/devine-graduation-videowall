import { DevineEasing } from '../../consts/DevineEasing.js';
import { PlaneType } from '../../consts/PlaneType.js';
import { ScreenRole } from "../../consts/ScreenRole.js";
import { createPlaneForScreen } from '../../functions/createPlaneForScreen.js';
import { delay } from '../../functions/delay.js';
import { calculateScaleForScreenConfig, doesScreenCameraHaveRole, getFirstScreenCameraForRole, getScreenCamerasForRole } from "../../functions/screenUtils.js";
import { gsap, Power4 } from '../../gsap/src/index.js';
import { ImagePlane } from './objects/ImagePlane.js';
import { StudentNamePlane } from './objects/StudentNamePlane.js';
import { PlaneSlider } from './PlaneSlider.js';
import { SceneBase, SceneState } from "./SceneBase.js";

const studentNameHeight = 280;
const studentNameTriangleMaxHeight = 80;

class ProjectDetailScene extends SceneBase {

  planeSliders = [];
  projectPlanes = [];
  colorPlanes = [];
  tl = false;

  allProfilePicturePlanes = [];
  nonVisibleProfilePicturePlanes = [];
  visibleProfilePicturePlanes = [];
  profilePicturePlaneSlider = false;

  allStudentNamePlanes = [];
  nonVisibleStudentNamePlanes = [];
  visibleStudentNamePlanes = [];
  studentNamePlaneSlider = false;

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
    console.log(this.project);

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
      let assets = project.attributes.assets;
      if (!assets) {
        assets = { data: [] };
      }
      this.portraitScreenshots = assets.data.filter(asset => {
        if (asset.attributes.mime.indexOf('image') === -1) {
          return false;
        }
        return asset.attributes.width < asset.attributes.height;
      }).map(asset => asset.attributes);
      this.landscapeScreenshots = assets.data.filter(asset => {
        if (asset.attributes.mime.indexOf('image') === -1) {
          return false;
        }
        return asset.attributes.width > asset.attributes.height;
      }).map(asset => asset.attributes);
      this.videos = assets.data.filter(asset => {
        return (asset.attributes.mime.indexOf('video') === 0);
      }).map(asset => asset.attributes);

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
        // create a plane for student names
        const screenConfig = this.screenConfigsById[profilePictureCamera.id];
        const screenScale = calculateScaleForScreenConfig(screenConfig);
        const scale = {...screenScale};
        scale.y *= ((studentNameHeight+studentNameTriangleMaxHeight) / 1920);

        const student = project;
        const plane = new StudentNamePlane(`student-name-${student.id}`, {
          position: {
            x: screenConfig.camera.position[0],
            y: screenConfig.camera.position[1] - (screenScale.y / 2 - scale.y / 2),
            z: -0.1
          },
          scale,
          textureSize: {
            x: 1080,
            y: (studentNameHeight+studentNameTriangleMaxHeight),
          },
          data: student
        });
        plane.customData.camera = profilePictureCamera;
        await plane.init();
        this.allStudentNamePlanes.push(plane);
        this.nonVisibleStudentNamePlanes.push(plane);
      }

      // create a plane for profile pictures
      const student = project;
      const props = {
        name: `profile-picture-${student.id}`,
        textureSize: {
          x: 1080,
          y: 1920
        },
        url: student.attributes.profilePicture.data?.attributes.url
      };
      const plane = new ImagePlane(props.name, props);
      await plane.init();
      this.allProfilePicturePlanes.push(plane);
      this.nonVisibleProfilePicturePlanes.push(plane);

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
          console.log(project);
          if (project.attributes.mainAsset?.data) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-main-video-${screenCamera.id}`,
                type: PlaneType.IMAGE,
                url: project.attributes.mainAsset.data.attributes.url,
                layers: screenCamera.props.layers,
                muted: false
              },
              screenConfig
            }); 
          }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROFILE_PICTURE)) {
          if (this.nonVisibleProfilePicturePlanes.length > 0) {
            projectPlane = this.nonVisibleProfilePicturePlanes.shift();
            projectPlane.applyProps(this.generatePropsForScreen(screenCamera));
            projectPlane.customData.camera = screenCamera;
            this.visibleProfilePicturePlanes.push(projectPlane);
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
          if (project.attributes.bio) {
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
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROJECT_CONTACT)) {
          projectPlane = await createPlaneForScreen({
            data: {
              id: `${idPrefix}-contact-${screenCamera.id}`,
              type: PlaneType.PROJECT_CONTACT,
              data: project,
              layers: screenCamera.props.layers
            },
            screenConfig
          });
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROJECT_DESCRIPTION)) {
          if (project.attributes.description) {
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
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROJECT_QUOTE)) {
          if (project.attributes.quote) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-quote-${screenCamera.id}`,
                type: PlaneType.PROJECT_QUOTE,
                data: project,
                layers: screenCamera.props.layers
              },
              screenConfig
            }); 
          }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.CURRICULUM_PICTURE)) {
          if (project.attributes.curriculum.data?.attributes.image.data?.attributes.url) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-curriculum-picture-${screenCamera.id}`,
                type: PlaneType.IMAGE,
                url: project.attributes.curriculum.data.attributes.image.data.attributes.url,
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
          // profile picture is less high
          const screenScale = calculateScaleForScreenConfig(screenConfig);
          const scale = {...screenScale};
          scale.y *= (studentNameHeight / 1920);
          projectPlane.applyProps({
            position: {
              x: projectPlane.props.position.x,
              y: projectPlane.props.position.y + (scale.y / 2),
              z: -0.2
            },
            scale: {
              x: projectPlane.props.scale.x,
              y: projectPlane.props.scale.y - scale.y
            }
          });
        }

        this.projectPlanes.push(projectPlane);
      };

    } else if (stateName === SceneState.INTRO) {

      const projectPlanes = this.projectPlanes;
      const colorPlanes = this.colorPlanes;
      const studentNamePlanes = this.allStudentNamePlanes;

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
          studentNamePlanes.forEach(plane => {
            const props = {
              position: plane.props.position,
            };
            plane.applyProps(props)
          });
          // this.studentNamePlane.applyProps({
          //   position: {
          //     x: this.studentNamePlane.props.position.x,
          //     y: this.studentNamePlane.props.position.y,
          //     z: this.studentNamePlane.props.position.z,
          //   }
          // });
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
        const isProfilePicturePlane = (this.visibleProfilePicturePlanes.includes(projectPlane));
        let studentNamePlane;
        if (isProfilePicturePlane) {
          studentNamePlane = this.nonVisibleStudentNamePlanes.shift();
          this.visibleStudentNamePlanes.push(studentNamePlane);
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
            if (isProfilePicturePlane) {
             this.addObject(studentNamePlane);
            }
            projectPlane.intro();
            if(studentNamePlane) {
              studentNamePlane.intro();
            }
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
        if (isProfilePicturePlane) {
          // schedule the name animation as well
          const endPropValues = JSON.parse(JSON.stringify(studentNamePlane.props));
          const startPropValues = JSON.parse(JSON.stringify(studentNamePlane.props));

          startPropValues.position.y -= .1;
          studentNamePlane.applyProps(startPropValues);

          this.tl.to(studentNamePlane.props.position, {y: endPropValues.position.y, ease: Power4.easeOut, delay: projectPlaneIntroDelay, duration: introProjectPlaneDuration}, 0);
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
        getSlideDelay: () => 1
      });

      this.profilePicturePlaneSlider = new PlaneSlider();
      this.profilePicturePlaneSlider.start({
        addObject: (o) => {
          this.addObject(o);
          this.visibleProfilePicturePlanes.push(o);
        },
        removeObject: (o) => {
          const indexToRemove = this.visibleProfilePicturePlanes.indexOf(o);
          if (indexToRemove >= this.visibleProfilePicturePlanes.length) {
            return;
          }
          this.visibleProfilePicturePlanes.splice(indexToRemove, 1);
          this.removeObject(o);
          this.nonVisibleProfilePicturePlanes.push(o);
        },
        getNewPlane: ({ oldPlane }) => {
          const newPlane = this.nonVisibleProfilePicturePlanes.shift();
          if (!newPlane) {
            return;
          }
          const setPropsNewPlane = this.generatePropsForScreen(oldPlane.customData.camera);
          newPlane.customData.camera = oldPlane.customData.camera;
          newPlane.applyProps(setPropsNewPlane);
          // profile picture is less high
          const screenConfig = this.screenConfigsById[newPlane.customData.camera.id];
          const screenScale = calculateScaleForScreenConfig(screenConfig);
          const scale = {...screenScale};
          scale.y *= (studentNameHeight / 1920);
          newPlane.applyProps({
            position: {
              x: newPlane.props.position.x,
              y: newPlane.props.position.y + (scale.y / 2),
              z: newPlane.props.position.z
            },
            scale: {
              x: newPlane.props.scale.x,
              y: newPlane.props.scale.y - scale.y
            }
          });
          return newPlane;
        },
        getOldPlane: () => {
          return this.visibleProfilePicturePlanes[0];
        },
        getAxis: ({ oldPlane, newPlane }) => {
          return 'horizontal';
        },
        getDirection: ({ oldPlane, newPlane }) => -1,
        getDelayForNextAnimation: () => this.config.scenes.projectDetail.screenshotSlideInterval,
        getSlideDuration: () => 1,
        getSlideDelay: () => 2
      });

      this.studentNamePlaneSlider = new PlaneSlider();
      this.studentNamePlaneSlider.start({
        addObject: (o) => {
          this.addObject(o);
          this.visibleStudentNamePlanes.push(o);
        },
        removeObject: (o) => {
          const indexToRemove = this.visibleStudentNamePlanes.indexOf(o);
          if (indexToRemove >= this.visibleStudentNamePlanes.length) {
            return;
          }
          this.visibleStudentNamePlanes.splice(indexToRemove, 1);
          this.removeObject(o);
          this.nonVisibleStudentNamePlanes.push(o);
        },
        getNewPlane: ({ oldPlane }) => {
          const newPlane = this.nonVisibleStudentNamePlanes.shift();
          if (!newPlane) {
            return;
          }
          newPlane.customData.camera = oldPlane.customData.camera;

          const screenConfig = this.screenConfigsById[newPlane.customData.camera.id];
          const screenScale = calculateScaleForScreenConfig(screenConfig);
          const scale = {...screenScale};
          scale.y *= ((studentNameHeight+studentNameTriangleMaxHeight) / 1920);

          const setPropsNewPlane = {
            position: {
              x: screenConfig.camera.position[0],
              y: screenConfig.camera.position[1] - (screenScale.y / 2 - scale.y / 2),
              z: -0.1
            },
            scale,
            textureSize: {
              x: 1080,
              y: (studentNameHeight+studentNameTriangleMaxHeight),
            }
          }
          newPlane.applyProps(setPropsNewPlane);
          return newPlane;
        },
        getOldPlane: () => {
          return this.visibleStudentNamePlanes[0];
        },
        getAxis: ({ oldPlane, newPlane }) => {
          return 'horizontal';
        },
        getDirection: ({ oldPlane, newPlane }) => -1,
        getDelayForNextAnimation: () => this.config.scenes.projectDetail.screenshotSlideInterval,
        getSlideDuration: () => 1,
        getSlideDelay: () => 2
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
      if (this.profilePicturePlaneSlider) {
        this.profilePicturePlaneSlider.stop();
      }
      if (this.studentNamePlaneSlider) {
        this.studentNamePlaneSlider.stop();
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

      // this.removeObject(this.studentNamePlane);
      this.visibleStudentNamePlanes.forEach(plane => {
        this.removeObject(plane);
      });
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

export { ProjectDetailScene };
