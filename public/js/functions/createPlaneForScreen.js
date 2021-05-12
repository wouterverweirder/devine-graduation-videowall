import { calculateScaleForScreenConfig } from './screenUtils.js';

import { VisualBase } from '../classes/scene/VisualBase.js';
import { ImagePlane } from '../classes/scene/ImagePlane.js';
import { ProjectStudentPlane } from '../classes/scene/ProjectStudentPlane.js';
import { ProjectAssetsPlane } from '../classes/scene/ProjectAssetsPlane.js';
import { ProjectDescriptionPlane } from '../classes/scene/ProjectDescriptionPlane.js';
import { PlaneType } from '../consts/PlaneType.js';

const calculateTextureSizeForScreen = (screenConfig) => {
  let rotation = 0;
  if (screenConfig.camera.rotation) {
    rotation = screenConfig.camera.rotation;
  }

  let x = 1920;
  let y = 1080;
  const textureSize = {
    x,
    y
  };
  if (rotation !== 0) {
    textureSize.x = y;
    textureSize.y = x;
  }
  return textureSize;
};

const createPlaneForScreen = async ({data, screenConfig}) => {

  const scale = (data.scale) ? data.scale : calculateScaleForScreenConfig(screenConfig);
  const textureSize = (data.textureSize) ? data.textureSize : calculateTextureSizeForScreen(screenConfig);

  const props = {};
  Object.assign(props, data);
  Object.assign(props, {
    name: `${data.type} plane ${screenConfig.id}`,
    position: {
      x: screenConfig.camera.position[0],
      y: screenConfig.camera.position[1],
      z: 0
    },
    scale,
    textureSize
  });

  let plane;
  if (data.type === PlaneType.IMAGE) {
    plane = new ImagePlane(data.id, props);
  } else if (data.type === PlaneType.PROJECT_ASSETS) {
    plane = new ProjectAssetsPlane(data.id, props);
  } else if (data.type === PlaneType.PROJECT_DESCRIPTION) {
    plane = new ProjectDescriptionPlane(data.id, props);
  } else if (data.type === PlaneType.PROFILE_PICTURE) {
    plane = new ProjectStudentPlane(data.id, props);
  } else {
    plane = new VisualBase(data.id, props);
  }
  await plane.init();
  return plane;
};

export {
  createPlaneForScreen
};
  