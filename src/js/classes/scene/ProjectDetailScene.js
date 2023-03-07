import { DevineEasing } from '../../consts/DevineEasing.js';
import { PlaneType } from '../../consts/PlaneType.js';
import { ScreenRole } from "../../consts/ScreenRole.js";
import { calculateTextureSizeForScreen, createPlaneForScreen } from '../../functions/createPlaneForScreen.js';
import { delay } from '../../functions/delay.js';
import { getValueByPath } from '../../functions/getValueByPath.js';
import { calculateScaleForScreenConfig, doesScreenCameraHaveRole } from "../../functions/screenUtils.js";
import { gsap, Power4 } from '../../gsap/src/index.js';
import { ImagePlane } from './objects/ImagePlane.js';
import { ProfilePicturePlane } from './objects/ProfilePicturePlane.js';
import { VideoPlane } from './objects/VideoPlane.js';
import { PlaneSlider } from './PlaneSlider.js';
import { SceneBase, SceneState } from "./SceneBase.js";

class ProjectDetailScene extends SceneBase {

  projectPlanes = [];
  colorPlanes = [];
  tl = false;

  objectsFromConfig = []; // objects created from the scene config, !== objects (visible in the scene)

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

      let assetsKey = (this.config.data.project.assets?.key) ? this.config.data.project.assets.key : "attributes.assets.data";
      // let assets = project.attributes.assets;
      let assets = getValueByPath(project, assetsKey);
      if (!assets) {
        assets = [];
      }

      await this.createObjectsForThisScene();

      const getAssetsWithMimeStartingWith = (mimeTypeStartsWith) => assets.filter(asset => {
        const attributes = (asset.attributes) ? asset.attributes : asset;
        return attributes.mime.startsWith(mimeTypeStartsWith)
      });

      const videos = getAssetsWithMimeStartingWith('video').map(asset => asset.attributes ? asset.attributes : asset);

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
          screenConfig,
          appConfig: this.config
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
        const projectAttributes = project.attributes ? project.attributes : project;
        if (doesScreenCameraHaveRole(screenCamera, ScreenRole.MAIN_VIDEO)) {
          // const mainAsset = getValueByPath(project, this.config.data.project.mainAsset.key);
          // if (mainAsset) {
          //   // video or image?
          //   const attributes = mainAsset.attributes ? mainAsset.attributes : mainAsset;
          //   const isVideo = attributes.mime.indexOf('video') === 0;
          //   projectPlane = await createPlaneForScreen({
          //     data: {
          //       id: `${idPrefix}-main-video-${screenCamera.id}`,
          //       type: (isVideo) ? PlaneType.VIDEO : PlaneType.IMAGE,
          //       url: attributes.url,
          //       layers: screenCamera.props.layers,
          //       muted: this.config.muted === undefined ? false : this.config.muted
          //     },
          //     screenConfig,
          //     appConfig: this.config
          //   });
          // }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.VIDEOS)) {
          if (videos.length > 0) {
            const video = videos.shift();
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-assets-${screenCamera.id}`,
                type: PlaneType.VIDEO,
                url: video.url,
                layers: screenCamera.props.layers
              },
              screenConfig,
              appConfig: this.config
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
          if (projectAttributes.bio) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-bio-${screenCamera.id}`,
                type: PlaneType.PROJECT_BIO,
                data: project,
                layers: screenCamera.props.layers
              },
              screenConfig,
              appConfig: this.config
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
            screenConfig,
            appConfig: this.config
          });
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROJECT_DESCRIPTION)) {
          if (projectAttributes.description) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-description-${screenCamera.id}`,
                type: PlaneType.PROJECT_DESCRIPTION,
                data: project,
                layers: screenCamera.props.layers
              },
              screenConfig,
              appConfig: this.config
            }); 
          }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.PROJECT_QUOTE)) {
          if (projectAttributes.quote) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-quote-${screenCamera.id}`,
                type: PlaneType.PROJECT_QUOTE,
                data: project,
                layers: screenCamera.props.layers
              },
              screenConfig,
              appConfig: this.config
            }); 
          }
        } else if (doesScreenCameraHaveRole(screenCamera, ScreenRole.CURRICULUM_PICTURE)) {
          if (projectAttributes.curriculum.data?.attributes.image.data?.attributes.url) {
            projectPlane = await createPlaneForScreen({
              data: {
                id: `${idPrefix}-curriculum-picture-${screenCamera.id}`,
                type: PlaneType.IMAGE,
                url: projectAttributes.curriculum.data.attributes.image.data.attributes.url,
                layers: screenCamera.props.layers
              },
              screenConfig,
              appConfig: this.config
            }); 
          }
        }
        if (!projectPlane) {
          // does one of the objectsFromConfig show something on this screen?
          this.objectsFromConfig.forEach((object) => {
            if (object instanceof VideoPlane) {
              if (object.objectConfig.screen.id === screenCamera.id) {
                projectPlane = object;
              }
            } else if (object instanceof PlaneSlider) {
              // does this planeslider need to show something on this screen?
              const indexOfScreenInObjectConfig = object.objectConfig.screens.findIndex(screen => screen.id === screenCamera.id);
              if (indexOfScreenInObjectConfig > -1) {
                // yes, it does
                if (object.nonVisiblePlanes.length > 0) {
                  projectPlane = object.nonVisiblePlanes.shift();
                  projectPlane.applyProps(this.generatePropsForScreen(screenCamera));
                  projectPlane.customData.camera = screenCamera;
                  object.visiblePlanes.push(projectPlane);
                }
              }
            }
          });
        }
        if (!projectPlane) {
          // add an empty plane on the screen when we have no plane on that screen
          projectPlane = await createPlaneForScreen({
            data: {
              id: `${idPrefix}-empty-${screenCamera.id}`,
              color: 0x000000,
              layers: screenCamera.props.layers
            },
            screenConfig,
            appConfig: this.config
          });
        }

        this.projectPlanes.push(projectPlane);
      };

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

        this.addObject(colorPlane);
      });

      this.objectsFromConfig.forEach(object => {
        // is the object a plane slider?
        if (object instanceof PlaneSlider) {
          object.start();
        }
      });

    } else if (stateName === SceneState.OUTRO) {

      if (this.tl) {
        this.tl.kill();
      }

      this.objectsFromConfig.forEach(object => {
        // is the object a plane slider?
        if (object instanceof PlaneSlider) {
          object.stop();
        }
      });

      await delay(1000);

      this.colorPlanes.forEach(plane => {
        this.removeObject(plane);
      });

      this.projectPlanes.forEach(plane => {
        this.removeObject(plane);
      });

      this.objectsFromConfig.forEach(object => {
        // is the object a plane slider?
        if (object instanceof PlaneSlider) {
          object.visiblePlanes.forEach(plane => {
            if (this.projectPlanes.includes(plane)) {
              return;
            }
            this.removeObject(plane);
          });
        }
      });
    }
  }

  async createObjectsForThisScene() {
    const project = this.project;
    // objects for this scene
    if (this.config.scenes.projectDetail?.objects?.length > 0) {
      for (let objectConfigIndex = 0; objectConfigIndex < this.config.scenes.projectDetail.objects.length; objectConfigIndex++) {
        const objectConfig = this.config.scenes.projectDetail.objects[objectConfigIndex];
        if (objectConfig.type === 'video') {
          const data = getValueByPath(project, objectConfig.dataSource.key);
          if (data) {
            const screenCamera = this.cameras.find(camera => camera.id === objectConfig.screen.id);
            const screenConfig = this.screenConfigsById[objectConfig.screen.id];
            const attributes = data.attributes ? data.attributes : data;
            const isVideo = attributes.mime.indexOf('video') === 0;
            const plane = await createPlaneForScreen({
              data: {
                id: `project-video-${project.id}-${attributes.url}`,
                type: (isVideo) ? PlaneType.VIDEO : PlaneType.IMAGE,
                url: attributes.url,
                layers: screenCamera.props.layers,
                muted: this.config.muted === undefined ? false : this.config.muted
              },
              screenConfig,
              appConfig: this.config
            });
            plane.objectConfig = objectConfig;
            this.objectsFromConfig.push(plane);
          }
        } else if (objectConfig.type === 'slider') {
          // load the planes for this slider
          const planes = [];
          let dataForSlider = getValueByPath(project, objectConfig.dataSource.key);
          // is dataForSlider an array?
          if (!Array.isArray(dataForSlider)) {
            dataForSlider = [dataForSlider];
          }
          objectConfig.dataSource.filters?.forEach(filter => {
            if (filter.type === 'landscape-images') {
              dataForSlider = dataForSlider.filter(asset => {
                const attributes = (asset.attributes) ? asset.attributes : asset;
                return attributes.mime.startsWith('image') && attributes.width > attributes.height;
              });
            } else if (filter.type === 'portrait-images') {
              dataForSlider = dataForSlider.filter(asset => {
                const attributes = (asset.attributes) ? asset.attributes : asset;
                return attributes.mime.startsWith('image') && attributes.width < attributes.height;
              });
            }
          });
          if (objectConfig.item?.type === 'image') {
            for (const asset of dataForSlider) {
              const attributes = (asset.attributes) ? asset.attributes : asset;
              const props = {
                name: `project-asset-${project.id}-${objectConfigIndex}-${attributes.url}`,
                textureSize: {
                  x: objectConfig.item.width,
                  y: objectConfig.item.height,
                },
                url: attributes.url,
                appConfig: this.config,
              };
              const plane = new ImagePlane(props.name, props);
              await plane.init();
              planes.push(plane);
            }
          } else if (objectConfig.item?.type === 'profile-picture') {
            for (let assetIndex = 0; assetIndex < dataForSlider.length; assetIndex++) {
              const asset = dataForSlider[assetIndex];
              const props = {
                name: `project-asset-${project.id}-${objectConfigIndex}-${assetIndex}`,
                textureSize: {
                  x: objectConfig.item.width,
                  y: objectConfig.item.height,
                },
                data: asset,
                appConfig: this.config,
              };
              const plane = new ProfilePicturePlane(props.name, props);
              await plane.init();
              planes.push(plane);
            }
          }
          // planes are loaded, create the slider
          const slider = new PlaneSlider(this, {
            objectConfig,
            nonVisiblePlanes: planes,
            visiblePlanes: [],
            setupNewPlane: ({ newPlane }) => {
              const setPropsNewPlane = this.generatePropsForScreen(newPlane.customData.camera);
              newPlane.applyProps(setPropsNewPlane);
              return newPlane;
            },
            getAxis: ({ newPlane }) => {
              const camera = newPlane.customData.camera;
              const isLandscape = !(camera.props.rotation.z !== 0);
              return (isLandscape) ? 'vertical' : 'horizontal';
            },
            getDelayForNextAnimation: () => objectConfig.slideInterval,
            getSlideDelay: () => objectConfig.slideDelay, //TODO: make this ms instead of seconds for consistency
            pickingMethod: objectConfig.pickingMethod,
          })
          this.objectsFromConfig.push(slider);
        }
      }
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
