import { getScreenCamerasForRoles, calculateScaleForScreenConfig } from "../../functions/screenUtils.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { ImagePlane } from './objects/ImagePlane.js';

class ProjectsOverviewScene extends SceneBase {

  async _executeStateName(stateName) {
    console.log(stateName);
    if (stateName === SceneState.LOAD) {
      const cameras = getScreenCamerasForRoles(this.cameras, [
        ScreenRole.PROFILE_PICTURE,
        ScreenRole.PROJECT_BIO,
        ScreenRole.PROJECT_DESCRIPTION,
        ScreenRole.PORTRAIT_SCREENSHOTS,
        ScreenRole.LANDSCAPE_SCREENSHOTS,
        ScreenRole.VIDEOS,
      ]);
  
      // add two projects per camera
      const projects = this.projects.concat();
      const planes = [];
      for (const camera of cameras) {
        const screenConfig = this.screenConfigsById[camera.id];
        const screenScale = calculateScaleForScreenConfig(screenConfig);
        const isLandscape = !(camera.props.rotation.z !== 0);
        for (let i = 0; i < 2; i++) {
          if (projects.length === 0) {
            break;
          }
          const project = projects.shift();
          const position = {
            x: screenConfig.camera.position[0],
            y: screenConfig.camera.position[1],
            z: 0
          };
          const scale = {
            x: screenScale.x,
            y: screenScale.y
          };
          if (isLandscape) {
            scale.x *= .5;
            position.x += (i === 0) ? -scale.x/2 : scale.x/2;
          } else {
            scale.y *= .5;
            position.y += (i === 0) ? -scale.y/2 : scale.y/2;
          }
          const props = {
            name: `project-overview-${project.id}`,
            position,
            scale,
            textureSize: {
              x: 1920,
              y: 1080
            },
            url: project.profilePicture.url
          };
          const plane = new ImagePlane(props.name, props);
          await plane.init();
          planes.push(plane);
        }
        this.planes = planes;
      }
    } else if (stateName === SceneState.INTRO) {
      const planes = this.planes;
      planes.forEach(plane => {
        this.addObject(plane);
      });
    } else if (stateName === SceneState.OUTRO) {
      const planes = this.planes;
      planes.forEach(plane => {
        this.removeObject(plane);
      });
    }
  }
}

export { ProjectsOverviewScene }