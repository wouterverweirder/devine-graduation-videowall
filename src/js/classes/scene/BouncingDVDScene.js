import { PlaneType } from "../../consts/PlaneType.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { createPlaneForScreen } from "../../functions/createPlaneForScreen.js";
import { getFirstScreenCameraForRole } from "../../functions/screenUtils.js";
import { SceneBase, SceneState } from "./SceneBase.js";

class BouncingDVDScene extends SceneBase {
  
  visiblePlanes = [];

  async _executeStateName(stateName) {
    if (stateName === SceneState.LOAD) {
      for (const camera of this.cameras) {
        // const camera = getFirstScreenCameraForRole(this.cameras, ScreenRole.MAIN_VIDEO);
        const screenConfig = this.screenConfigsById[camera.id];
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
            type: PlaneType.BOUNCING_DVD,
            scale,
            textureSize,
            velocity: {
              x: (Math.random() > 0.5) ? -0.001 : 0.001,
              y: (Math.random() > 0.5) ? -0.001 : 0.001,
              z: 0
            },
            screenConfig
          },
          screenConfig
        });
        this.visiblePlanes.push(plane);
      }
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
