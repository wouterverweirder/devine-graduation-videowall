import { ORIENTATION_LANDSCAPE, calculateScaleForScreenConfig, getOrientationForRotation } from './screenUtils.js';

import { VisualBase } from '../classes/scene/objects/VisualBase.js';
import { ImagePlane } from '../classes/scene/objects/ImagePlane.js';
import { PlaneType } from '../consts/PlaneType.js';
import { ProjectTextPlane } from '../classes/scene/objects/ProjectTextPlane.js';
import { ProjectQuotePlane } from '../classes/scene/objects/ProjectQuotePlane.js';
import { ProjectContactPlane } from '../classes/scene/objects/ProjectContactPlane.js';
import { CanvasPlane } from '../classes/scene/objects/CanvasPlane.js';
import { DevineInfoPlane } from '../classes/scene/objects/devine/DevineInfoPlane.js';
import { VideoPlane } from '../classes/scene/objects/VideoPlane.js';
import { BouncingDVD } from '../classes/scene/objects/BouncingDVD.js';

export const calculateTextureSizeForScreen = (screenConfig) => {
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
  const orientation = getOrientationForRotation(rotation);
  const isLandscape = orientation.orientation === ORIENTATION_LANDSCAPE;
  if (!isLandscape) {
    textureSize.x = y;
    textureSize.y = x;
  }
  return textureSize;
};

const createPlaneForScreen = async ({data, screenConfig, appConfig}) => {

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
    textureSize,
    appConfig
  });

  let plane;
  if (data.type === PlaneType.IMAGE) {
    plane = new ImagePlane(data.id, props);
  } else if (data.type === PlaneType.VIDEO) {
    plane = new VideoPlane(data.id, props);
  } else if (data.type === PlaneType.CANVAS) {
    plane = new CanvasPlane(data.id, props);
  } else if (data.type === PlaneType.PROJECT_DESCRIPTION) {
    plane = new ProjectTextPlane(data.id, { ...props, planeConfig: props.appConfig.planes.descriptionPlane });
  } else if (data.type === PlaneType.TEXT) {
    plane = new ProjectTextPlane(data.id, props);
  } else if (data.type === PlaneType.PROJECT_BIO) {
    plane = new ProjectTextPlane(data.id, { ...props, planeConfig: props.appConfig.planes.bioPlane });
  } else if (data.type === PlaneType.PROJECT_QUOTE) {
    plane = new ProjectQuotePlane(data.id, props);
  } else if (data.type === PlaneType.PROJECT_CONTACT) {
    plane = new ProjectContactPlane(data.id, props);
  } else if (data.type === PlaneType.DEVINE_INFO) {
    plane = new DevineInfoPlane(data.id, props);
  } else if (data.type === PlaneType.BOUNCING_DVD) {
    plane = new BouncingDVD(data.id, props);
  } else {
    plane = new VisualBase(data.id, props);
  }
  await plane.init();
  return plane;
};

export {
  createPlaneForScreen
};
  