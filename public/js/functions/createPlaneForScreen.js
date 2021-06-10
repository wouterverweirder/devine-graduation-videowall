import { calculateScaleForScreenConfig } from './screenUtils.js';

import { VisualBase } from '../classes/scene/objects/VisualBase.js';
import { ImagePlane } from '../classes/scene/objects/ImagePlane.js';
import { ProjectStudentPlane } from '../classes/scene/objects/ProjectStudentPlane.js';
import { ProjectAssetsPlane } from '../classes/scene/objects/ProjectAssetsPlane.js';
import { ProjectDescriptionPlane } from '../classes/scene/objects/ProjectDescriptionPlane.js';
import { PlaneType } from '../consts/PlaneType.js';
import { ProjectBioPlane } from '../classes/scene/objects/ProjectBioPlane.js';
import { CanvasPlane } from '../classes/scene/objects/CanvasPlane.js';
import { DevineInfoPlane } from '../classes/scene/objects/DevineInfoPlane.js';

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
  const zPosition = (data.position && data.position.z) ? data.position.z : 0;

  const props = {};
  Object.assign(props, data);
  Object.assign(props, {
    name: `${data.id}`,
    position: {
      x: screenConfig.camera.position[0],
      y: screenConfig.camera.position[1],
      z: zPosition
    },
    scale,
    textureSize
  });

  let plane;
  if (data.type === PlaneType.IMAGE) {
    plane = new ImagePlane(data.id, props);
  } else if (data.type === PlaneType.CANVAS) {
    plane = new CanvasPlane(data.id, props);
  } else if (data.type === PlaneType.PROJECT_ASSETS) {
    plane = new ProjectAssetsPlane(data.id, props);
  } else if (data.type === PlaneType.PROJECT_DESCRIPTION) {
    plane = new ProjectDescriptionPlane(data.id, props);
  } else if (data.type === PlaneType.PROFILE_PICTURE) {
    plane = new ProjectStudentPlane(data.id, props);
  } else if (data.type === PlaneType.PROJECT_BIO) {
    plane = new ProjectBioPlane(data.id, props);
  } else if (data.type === PlaneType.DEVINE_INFO) {
    plane = new DevineInfoPlane(data.id, props);
  } else {
    plane = new VisualBase(data.id, props);
  }
  await plane.init();
  return plane;
};

export {
  createPlaneForScreen
};
  