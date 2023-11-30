import { PlaneType } from '../../consts/PlaneType.js';
import { createPlaneForScreen } from '../../functions/createPlaneForScreen.js';
import { delay } from '../../functions/delay.js';
import { getFilteredDataSource } from '../../functions/getFilteredDataSource.js';
import { calculateScaleForScreenConfig, getOrientationForRotation, ORIENTATION_LANDSCAPE } from "../../functions/screenUtils.js";
import { ImagePlane } from './objects/ImagePlane.js';
import { ProfilePicturePlane } from './objects/ProfilePicturePlane.js';
import { VisualBase } from './objects/VisualBase.js';
import { PlaneSlider } from './PlaneSlider.js';
import { SceneBase, SceneState } from "./SceneBase.js";

class ProjectsOverviewScene extends SceneBase {

  projectPlanes = [];
  tl = false;

  objectsFromConfig = []; // objects created from the scene config, !== objects (visible in the scene)

  async _executeStateName(stateName) {
    if (stateName === SceneState.LOAD) {
      // create planes per screen
      this.projectPlanes = [];

      this.createDataSourcesForThisScene(this.fetchProjectsResult, this.config.scenes.projectsOverview);

      await this.createObjectsForThisScene();

      for (const screenCamera of this.camerasFromBottomToTop) {
        const screenConfig = this.screenConfigsById[screenCamera.id];
        let projectPlanes = [];
        if (projectPlanes.length === 0) {
          // does one of the objectsFromConfig show something on this screen?
          this.objectsFromConfig.forEach((object) => {
            if (object instanceof VisualBase) {
              if (object.objectConfig.screen.id === screenCamera.id) {
                projectPlanes.push(object);
              }
            } else if (object instanceof PlaneSlider) {
              // does this planeslider need to show something on this screen?
              object.objectConfig.screens.filter(screen => screen.id === screenCamera.id).forEach(sliderScreen => {
                if (object.nonVisiblePlanes.length > 0) {
                  const projectPlane = object.nonVisiblePlanes.shift();
                  projectPlane.applyProps(this.generatePropsForSliderPlane(sliderScreen));
                  projectPlane.customData.sliderScreen = sliderScreen;
                  object.visiblePlanes.push(projectPlane);
                  projectPlanes.push(projectPlane);
                }
              });
            }
          });
        }
        if (projectPlanes.length === 0) {
          // add an empty plane on the screen when we have no plane on that screen
          const projectPlane = await createPlaneForScreen({
            data: {
              id: `${this.id}-empty-${screenCamera.id}`,
              color: 0x000000,
              layers: screenCamera.props.layers
            },
            screenConfig,
            appConfig: this.config
          });
          projectPlanes.push(projectPlane);
        }

        this.projectPlanes = this.projectPlanes.concat(projectPlanes);
      };

    } else if (stateName === SceneState.INTRO) {
      const projectPlanes = this.projectPlanes;
      projectPlanes.forEach((projectPlane) => {
        this.addObject(projectPlane);
        projectPlane.intro();
      });

      this.objectsFromConfig.forEach(object => {
        // is the object a plane slider?
        if (object instanceof PlaneSlider) {
          object.start();
        }
      });

    } else if (stateName === SceneState.OUTRO) {
      this.objectsFromConfig.forEach(object => {
        // is the object a plane slider?
        if (object instanceof PlaneSlider) {
          object.stop();
        }
      });

      await delay(1000);

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

  dispose() {
    super.dispose();

    this.projectPlanes.forEach(plane => {
      if (plane.dispose) {
        plane.dispose();
      }
    });

    this.objectsFromConfig.forEach(object => {
      // is the object a plane slider?
      if (object instanceof PlaneSlider) {
        object.dispose();
      }
    });
  }

  async createObjectsForThisScene() {
    // objects for this scene
    if (this.config.scenes.projectsOverview?.objects?.length > 0) {
      for (let objectConfigIndex = 0; objectConfigIndex < this.config.scenes.projectsOverview.objects.length; objectConfigIndex++) {
        const objectConfig = this.config.scenes.projectsOverview.objects[objectConfigIndex];
        if (objectConfig.type === 'video' || objectConfig.type === 'image') {
          let data = [];
          if (Array.isArray(objectConfig.dataSource)) {
            data = objectConfig.dataSource;
          } else {
            data = this.dataSourcesByKey[objectConfig.dataSource.key];
          }
          if (!data) {
            console.warn(`No dataSource found for key ${objectConfig.dataSource.key}`);
            continue;
          }
          if (!Array.isArray(objectConfig.dataSource)) {
            data = getFilteredDataSource(data, objectConfig.dataSource);
          }
          if (data.length === 0) {
            continue;
          }
          data = data[0];
          if (objectConfig.dataSource.key) {
            // remove this item from the data source to prevent duplicates
            this.dataSourcesByKey[objectConfig.dataSource.key] = this.dataSourcesByKey[objectConfig.dataSource.key].filter(item => item !== data);
          }
          const screenCamera = this.cameras.find(camera => camera.id === objectConfig.screen.id);
          const screenConfig = this.screenConfigsById[objectConfig.screen.id];
          const attributes = data.attributes ? data.attributes : data;
          // if no mime attributes are set, generate them
          if (!attributes.mime) {
            if (attributes.url.indexOf('.mp4') > -1) {
              attributes.mime = 'video/mp4';
            } else if (attributes.url.indexOf('.webm') > -1) {
              attributes.mime = 'video/webm';
            } else if (attributes.url.indexOf('.jpg') > -1) {
              attributes.mime = 'image/jpg';
            } else if (attributes.url.indexOf('.png') > -1) {
              attributes.mime = 'image/png';
            }
          }
          const isVideo = attributes.mime.indexOf('video') === 0;
          const plane = await createPlaneForScreen({
            data: {
              id: `${this.id}-video-${attributes.url}`,
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
        } else if (objectConfig.type === 'devine-main') {
          const screenConfig = this.screenConfigsById[objectConfig.screen.id];
          const plane = await createPlaneForScreen({
            data: {
              id: 'devine-info',
              type: PlaneType.DEVINE_INFO
            },
            screenConfig,
            appConfig: this.config
          });
          plane.objectConfig = objectConfig;
          this.objectsFromConfig.push(plane);
        }else if (objectConfig.type === 'slider') {
          // load the planes for this slider
          const planes = [];
          let dataForSlider = this.dataSourcesByKey[objectConfig.dataSource.key];
          // is dataForSlider an array?
          if (!Array.isArray(dataForSlider)) {
            dataForSlider = [dataForSlider];
          }
          dataForSlider = getFilteredDataSource(dataForSlider, objectConfig.dataSource);
          if (objectConfig.item?.type === 'image') {
            for (const asset of dataForSlider) {
              const attributes = (asset.attributes) ? asset.attributes : asset;
              const props = {
                name: `${this.id}-assets-${objectConfigIndex}-${attributes.url}`,
                textureSize: {
                  x: objectConfig.item.width || 1920,
                  y: objectConfig.item.height || 1920,
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
                name: `${this.id}-asset-${objectConfigIndex}-${assetIndex}`,
                textureSize: {
                  x: objectConfig.item.width,
                  y: objectConfig.item.height,
                },
                data: asset,
                namePlane: objectConfig.item.namePlane,
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
              const setPropsNewPlane = this.generatePropsForSliderPlane(newPlane.customData.sliderScreen);
              newPlane.applyProps(setPropsNewPlane);
              return newPlane;
            },
            getAxis: ({ newPlane }) => {
              const sliderScreen = newPlane.customData.sliderScreen;
              const screenCamera = this.cameras.find(camera => camera.id === sliderScreen.id);
              const orientation = getOrientationForRotation(screenCamera.props.rotation.z);
              const isLandscape = orientation.orientation === ORIENTATION_LANDSCAPE;
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

  generatePropsForSliderPlane(sliderScreen) {
    const camera = this.cameras.find(camera => camera.id === sliderScreen.id);
    const screenConfig = this.screenConfigsById[camera.id];
    const screenScale = calculateScaleForScreenConfig(screenConfig);

    const layers = (camera.props.layers) ? camera.props.layers.concat() : false;

    // default area is set to fill the entire screen
    const area = {
      x: 0,
      y: 0,
      width: 1,
      height: 1
    }

    if (sliderScreen?.area) {
      area.x = sliderScreen.area.x;
      area.y = sliderScreen.area.y;
      area.width = sliderScreen.area.width;
      area.height = sliderScreen.area.height;
    }

    const scale = {
      x: screenScale.x * area.width,
      y: screenScale.y * area.height
    };

    const diffWidth = screenScale.x - scale.x;
    const diffHeight = screenScale.y - scale.y;

    const position = {
      x: screenConfig.camera.position[0] + diffWidth / 2 - area.x * screenScale.x,
      y: screenConfig.camera.position[1] + diffHeight / 2 - area.y * screenScale.y,
      z: 0
    };

    return {
      layers,
      position,
      scale
    };
  };
}

export { ProjectsOverviewScene };
