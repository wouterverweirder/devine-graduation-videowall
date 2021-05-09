import calculateScaleForScreen from './calculateScaleForScreen.js';

import { VisualBase } from '../classes/scene/VisualBase.js';
import { ImagePlane } from '../classes/scene/ImagePlane.js';
import { ProjectStudentPlane } from '../classes/scene/ProjectStudentPlane.js';
import { ProjectAssetsPlane } from '../classes/scene/ProjectAssetsPlane.js';
import { ProjectDescriptionPlane } from '../classes/scene/ProjectDescriptionPlane.js';

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

const createPlaneForScreen = async ({userData, screenConfig, appConfig}) => {

  const scale = calculateScaleForScreen(screenConfig);
  const textureSize = calculateTextureSizeForScreen(screenConfig);

  const props = {};
  Object.assign(props, userData);
  Object.assign(props, {
    name: `${userData.type} plane ${screenConfig.id}`,
    position: {
      x: screenConfig.camera.position[0],
      y: screenConfig.camera.position[1],
      z: 0
    },
    scale,
    textureSize
  });

  let plane;
  if (userData.type === 'image') {
    plane = new ImagePlane(userData.id, props);
  } else if (userData.type === 'project-assets') {
    plane = new ProjectAssetsPlane(userData.id, props);
  } else if (userData.type === 'project-description') {
    plane = new ProjectDescriptionPlane(userData.id, props);
  } else if (userData.type === 'project-student') {
    plane = new ProjectStudentPlane(userData.id, props);
  } else {
    plane = new VisualBase(userData.id, props);
  }
  await plane.init();
  return plane;
};

export {
  createPlaneForScreen
};
  