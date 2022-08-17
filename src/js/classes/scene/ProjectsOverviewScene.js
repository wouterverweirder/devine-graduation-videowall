import { getScreenCamerasForRoles, calculateScaleForScreenConfig, getFirstScreenCameraForRole } from "../../functions/screenUtils.js";
import { createPlaneForScreen } from "../../functions/createPlaneForScreen.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { ImagePlane } from './objects/ImagePlane.js';
import { delay } from '../../functions/delay.js';
import { PlaneType } from '../../consts/PlaneType.js';
import { PlaneSlider } from './PlaneSlider.js';

class ProjectsOverviewScene extends SceneBase {

  allProjectPlanes = [];
  nonVisiblePlanes = [];
  visiblePlanes = [];
  devineInfoPlane = false;
  animationTimeoutId = false;
  instructionsPlane = false;

  async _executeStateName(stateName) {
    if (stateName === SceneState.LOAD) {

      // create a plane for each student
      for (let index = 0; index < this.students.length; index++) {
        const student = this.students[index];
        const props = {
          name: `project-overview-${student.id}-${index}`,
          textureSize: {
            x: 1920,
            y: 1920
          },
          url: student.attributes.profilePicture.data?.attributes.url
        };
        const plane = new ImagePlane(props.name, props);
        await plane.init();
        this.allProjectPlanes.push(plane);
        this.nonVisiblePlanes.push(plane);
      }
      {
        // create the devine info plane
        const mainCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.MAIN_VIDEO);
        const screenConfig = this.screenConfigsById[mainCamera.id];
        this.instructionsPlane = await createPlaneForScreen({
          data: {
            id: 'devine-info',
            type: PlaneType.DEVINE_INFO
          },
          screenConfig
        });
      }
      {
        // create the instructions plane
        const descriptionCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.PROJECT_DESCRIPTION);
        const screenConfig = this.screenConfigsById[descriptionCamera.id];
        this.devineInfoPlane = await createPlaneForScreen({
          data: {
            id: 'instructions',
            type: PlaneType.VIDEO,
            url: 'assets/footswitch.mp4',
            layers: descriptionCamera.props.layers
          },
          screenConfig
        });
      }


    } else if (stateName === SceneState.INTRO) {
      const cameras = getScreenCamerasForRoles(this.cameras, [
        ScreenRole.PROFILE_PICTURE,
        ScreenRole.PROJECT_BIO,
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

      this.addObject(this.devineInfoPlane);
      this.devineInfoPlane.intro();

      this.addObject(this.instructionsPlane);
      this.instructionsPlane.intro();

      this.planeSlider = new PlaneSlider();
      this.planeSlider.start({
        addObject: (o) => {
          this.addObject(o);
          this.visiblePlanes.push(o);
        },
        removeObject: (o) => {
          const indexToRemove = this.visiblePlanes.indexOf(o);
          if (indexToRemove >= this.visiblePlanes.length) {
            return;
          }
          this.visiblePlanes.splice(indexToRemove, 1);
          this.removeObject(o);
          this.nonVisiblePlanes.push(o);
        },
        getNewPlane: ({ oldPlane }) => {
          const newPlane = this.nonVisiblePlanes.shift();
          if (!newPlane) return;
          const setPropsNewPlane = this.generatePropsForScreen(oldPlane.customData.camera, oldPlane.customData.isFirstItemOnScreen);
          newPlane.customData.camera = oldPlane.customData.camera;
          newPlane.customData.isFirstItemOnScreen = oldPlane.customData.isFirstItemOnScreen;
          newPlane.applyProps(setPropsNewPlane);
          return newPlane;
        },
        getOldPlane: () => {
          // choose a random item to replace
          const index = Math.floor(Math.random() * this.visiblePlanes.length);
          if (index >= this.visiblePlanes.length) {
            return;
          }
          return this.visiblePlanes[index];
        },
        getAxis: ({ oldPlane, newPlane }) => {
          const camera = oldPlane.customData.camera;
          const isLandscape = !(camera.props.rotation.z !== 0);
          return (isLandscape) ? 'vertical' : 'horizontal';
        },
        getDirection: ({ oldPlane, newPlane }) => (Math.random() < .5) ? 1 : -1,
        getDelayForNextAnimation: () => this.config.scenes.projectsOverview.updateInterval,
        getSlideDuration: () => 1
      });

    } else if (stateName === SceneState.OUTRO) {
      
      this.planeSlider.stop();

      await delay(1000);

      this.visiblePlanes.forEach(plane => {
        this.removeObject(plane);
      });

      this.removeObject(this.devineInfoPlane);
      this.removeObject(this.instructionsPlane);
    }
  }

  generatePropsForScreen(camera, isFirstItemOnScreen) {
    const screenConfig = this.screenConfigsById[camera.id];
    const screenScale = calculateScaleForScreenConfig(screenConfig);
    const isLandscape = !(camera.props.rotation.z !== 0);
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
    const anchor = {
      x: 0.5,
      y: 0.5
    };
    if (isLandscape) {
      scale.x *= .5;
      position.x += isFirstItemOnScreen ? -scale.x/2 : scale.x/2;
      anchor.y = (Math.random() < .5) ? 1 : 0;
    } else {
      scale.y *= .5;
      position.y += isFirstItemOnScreen ? -scale.y/2 : scale.y/2;
      anchor.x = (Math.random() < .5) ? 1 : 0;
    }
    return {
      layers,
      position,
      scale,
      anchor
    };
  };
}

export { ProjectsOverviewScene }