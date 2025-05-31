import { ORIENTATION_LANDSCAPE, calculateScaleForScreenConfig, getOrientationForRotation } from './screenUtils';

import { BouncingDVD } from '../classes/scene/objects/BouncingDVD';
import { CanvasPlane } from '../classes/scene/objects/CanvasPlane';
import { DevineInfoPlane } from '../classes/scene/objects/devine/DevineInfoPlane';
import { ImagePlane } from '../classes/scene/objects/ImagePlane';
import { ProjectContactPlane } from '../classes/scene/objects/ProjectContactPlane';
import { ProjectQuotePlane } from '../classes/scene/objects/ProjectQuotePlane';
import { ProjectTextPlane } from '../classes/scene/objects/ProjectTextPlane';
import { VideoPlane } from '../classes/scene/objects/VideoPlane';
import { OptionalVisualBaseProps, VisualBase } from '../classes/scene/objects/VisualBase';
import { PlaneType } from '../consts/PlaneType';
import { ApplicationConfig, ScreenConfig } from '../types';

export const calculateTextureSizeForScreen = (screenConfig:ScreenConfig) => {
  let rotation = 0;
  if (screenConfig.camera.rotation) {
    rotation = screenConfig.camera.rotation;
  }

  const x = 1920;
  const y = 1080;
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

export type CreatePlaneForScreenData = OptionalVisualBaseProps & {
  id: string;
  screenId?: string;
  type?: string;
}
const createPlaneForScreen = async ({data, screenConfig, applicationConfig}: {data:CreatePlaneForScreenData, screenConfig: ScreenConfig, applicationConfig: ApplicationConfig}) => {

  const scale = (data.scale) ? data.scale : calculateScaleForScreenConfig(screenConfig);
  const textureSize = (data.textureSize) ? data.textureSize : calculateTextureSizeForScreen(screenConfig);
  const zPosition = (data.position && data.position.z) ? data.position.z : 0;

  const props:OptionalVisualBaseProps = {
    ...data,
    name: `${data.id}`,
    position: {
      x: screenConfig.camera.position[0],
      y: screenConfig.camera.position[1],
      z: zPosition
    },
    scale,
    textureSize,
    applicationConfig
  };

  let plane;
  if (data.type === PlaneType.IMAGE) {
    plane = new ImagePlane(data.id, props);
  } else if (data.type === PlaneType.VIDEO) {
    plane = new VideoPlane(data.id, props);
  } else if (data.type === PlaneType.CANVAS) {
    plane = new CanvasPlane(data.id, props);
  } else if (data.type === PlaneType.TEXT) {
    console.log('createPlaneForScreen', props);
    plane = new ProjectTextPlane(data.id, props);
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
  