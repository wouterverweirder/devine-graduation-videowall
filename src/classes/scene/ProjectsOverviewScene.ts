import { PlaneType } from '../../consts/PlaneType';
import { createPlaneForScreen } from '../../functions/createPlaneForScreen';
import { delay } from '../../functions/delay';
import { getFilteredDataSource } from '../../functions/getFilteredDataSource';
import { getOrientationForRotation, ORIENTATION_LANDSCAPE } from "../../functions/screenUtils";
import { isSliderSceneObjectConfig } from '../../types';
import { ImagePlane } from './objects/ImagePlane';
import { ProfilePicturePlane, ProfilePicturePlaneConfig } from './objects/ProfilePicturePlane';
import { VisualBase } from './objects/VisualBase';
import { PlaneSlider } from './PlaneSlider';
import { SceneBase, SceneState } from "./SceneBase";

type Attributes = {
  url: string;
  mime?: string;
}

class ProjectsOverviewScene extends SceneBase {

  projectPlanes:VisualBase[] = [];
  tl:gsap.core.Timeline | boolean = false;

  objectsFromConfig: (VisualBase | PlaneSlider)[] = []; // objects created from the scene config, !== objects (visible in the scene)

  async _executeStateName(stateName:string) {
    if (stateName === SceneState.LOAD) {
      // create planes per screen
      this.projectPlanes = [];

      this.createDataSourcesForThisScene(this.fetchProjectsResult, this.applicationConfig.scenes.projectsOverview);

      await this.createObjectsForThisScene();

      for (const screenCamera of this.camerasFromBottomToTop) {
        const screenConfig = this.screenConfigsById[screenCamera.id];
        const projectPlanes = [];
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
            applicationConfig: this.applicationConfig
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
    if (this.applicationConfig.scenes.projectsOverview?.objects?.length > 0) {
      for (let objectConfigIndex = 0; objectConfigIndex < this.applicationConfig.scenes.projectsOverview.objects.length; objectConfigIndex++) {
        const objectConfig = this.applicationConfig.scenes.projectsOverview.objects[objectConfigIndex];
        if (objectConfig.type === 'video' || objectConfig.type === 'image') {
          let data = [];
          if (Array.isArray(objectConfig.dataSource)) {
            data = objectConfig.dataSource;
          } else {
            data = this.dataSourcesByKey[objectConfig.dataSource.key];
          }
          if (!data) {
            console.warn(`No dataSource found for ${JSON.stringify(objectConfig.dataSource)}`);
            continue;
          }
          if (!Array.isArray(objectConfig.dataSource)) {
            data = getFilteredDataSource(data, objectConfig.dataSource);
          }
          if (data.length === 0) {
            continue;
          }
          const firstDataItem = data[0];
          if ('key' in objectConfig.dataSource) {
            // remove this item from the data source to prevent duplicates
            this.dataSourcesByKey[objectConfig.dataSource.key] = this.dataSourcesByKey[objectConfig.dataSource.key].filter(item => item !== firstDataItem);
          }
          const screenCamera = this.cameras.find(camera => camera.id === objectConfig.screen.id);
          const screenConfig = this.screenConfigsById[objectConfig.screen.id];
          const attributes = ('attributes' in firstDataItem) ? firstDataItem.attributes as Attributes : firstDataItem as Attributes;
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
              muted: this.applicationConfig.muted === undefined ? false : this.applicationConfig.muted
            },
            screenConfig,
            applicationConfig: this.applicationConfig
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
            applicationConfig: this.applicationConfig
          });
          plane.objectConfig = objectConfig;
          this.objectsFromConfig.push(plane);
        } else if (isSliderSceneObjectConfig(objectConfig)) {
          // load the planes for this slider
          const planes = [];
          let dataForSlider = ('key' in objectConfig.dataSource) ? this.dataSourcesByKey[objectConfig.dataSource.key] : [];
          // is dataForSlider an array?
          if (!Array.isArray(dataForSlider)) {
            dataForSlider = [dataForSlider];
          }
          dataForSlider = getFilteredDataSource(dataForSlider, objectConfig.dataSource);
          if (objectConfig.item.type === 'image') {
            for (const asset of dataForSlider) {
              const attributes = ('attributes' in asset) ? asset.attributes as Attributes : asset as Attributes;
              const props = {
                name: `${this.id}-assets-${objectConfigIndex}-${attributes.url}`,
                textureSize: {
                  x: objectConfig.item.width || 1920,
                  y: objectConfig.item.height || 1920,
                },
                url: attributes.url,
                applicationConfig: this.applicationConfig,
              };
              const plane = new ImagePlane(props.name, props);
              await plane.init();
              planes.push(plane);
            }
          } else if (objectConfig.item?.type === 'profile-picture') {
            for (let assetIndex = 0; assetIndex < dataForSlider.length; assetIndex++) {
              if ('namePlane' in objectConfig.item) {
                const asset = dataForSlider[assetIndex];
                const props = {
                  name: `${this.id}-asset-${objectConfigIndex}-${assetIndex}`,
                  textureSize: {
                    x: objectConfig.item.width,
                    y: objectConfig.item.height,
                  },
                  data: asset,
                  namePlane: objectConfig.item.namePlane as ProfilePicturePlaneConfig,
                  applicationConfig: this.applicationConfig,
                };
                const plane = new ProfilePicturePlane(props.name, props);
                await plane.init();
                planes.push(plane);
              }
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
}

export { ProjectsOverviewScene };
