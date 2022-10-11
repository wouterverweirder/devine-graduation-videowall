import { ScreenRole } from "../../consts/ScreenRole.js";
import { createPlaneForScreen } from "../../functions/createPlaneForScreen.js";
import { getFirstScreenCameraForRole } from "../../functions/screenUtils.js";
import { SceneBase, SceneState } from "./SceneBase.js";

class BouncingDVDScene extends SceneBase {
  
  visiblePlanes = [];

  async _executeStateName(stateName) {
    if (stateName === SceneState.LOAD) {
      const mainCamera = getFirstScreenCameraForRole(this.cameras, ScreenRole.MAIN_VIDEO);
      const screenConfig = this.screenConfigsById[mainCamera.id];
      const textureSize = {
        x: 512,
        y: 237
      };
      const scale = {
        x: textureSize.x / 2000,
        y: textureSize.y / 2000
      }
      const plane = await createPlaneForScreen({
        data: {
          id: 'bouncing-dvd',
          type: 'image',
          url: 'assets/dvd-logo.png',
          scale,
          textureSize,
          velocity: {
            x: 0.001,
            y: 0.001,
            z: 0
          }
        },
        screenConfig
      });
      plane.render = () => {
        const velocity = plane.props.velocity;
        if (plane.props.position.x - scale.x / 2 < screenConfig.camera.position[0] - screenConfig.camera.size.width / 2) {
          velocity.x = Math.abs(velocity.x);
        }
        if (plane.props.position.x + scale.x / 2 > screenConfig.camera.position[0] + screenConfig.camera.size.width / 2) {
          velocity.x = -Math.abs(velocity.x);
        }
        if (plane.props.position.y - scale.y / 2 < screenConfig.camera.position[1] - screenConfig.camera.size.height / 2) {
          velocity.y = Math.abs(velocity.y);
        }
        if (plane.props.position.y + scale.y / 2 > screenConfig.camera.position[1] + screenConfig.camera.size.height / 2) {
          velocity.y = -Math.abs(velocity.y);
        }
        plane.applyProps({
          position: {
            x: plane.props.position.x + velocity.x,
            y: plane.props.position.y + velocity.y,
            z: 0
          },
          velocity
        });
        
      };
      this.visiblePlanes.push(plane);
    } else if (stateName === SceneState.INTRO) {
      this.visiblePlanes.forEach(plane => {
        this.addObject(plane);
      });
    } else if (stateName === SceneState.OUTRO) {
      this.visiblePlanes.forEach(plane => {
        this.removeObject(plane);
      });
    }
  }
  
}

export { BouncingDVDScene };
