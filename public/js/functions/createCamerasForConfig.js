import { ScreenCamera } from '../classes/scene/ScreenCamera.js';
import * as THREE from '../three.js/build/three.module.js';

const getBoundsForSize = ({width, height}) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const left = -1 * halfWidth;
  const right = 1 * halfWidth;
  const top = 1 * halfHeight;
  const bottom = -1 * halfHeight;
  return {
    left,
    right,
    top,
    bottom
  }
};

const getSizeForBounds = ({left, right, top, bottom}) => {
  return { width: right - left, height: top - bottom };
};

const createCamerasForConfig = async (config) => {
  const cameras = [];
  for ( let ii = 0; ii < config.screens.length; ++ ii ) {
    const screen = config.screens[ ii ];

    const bounds = getBoundsForSize(screen.camera.size);
    let rotation = 0;
    if (screen.camera.rotation) {
      rotation = screen.camera.rotation;
    }

    const camera = new ScreenCamera(screen.id, {
      name: `Screen ${ii}`,
      position: {
        x: screen.camera.position[0],
        y: screen.camera.position[1],
        z: screen.camera.position[2]
      },
      rotation: {
        x: 0,
        y: 0,
        z: rotation
      },
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom
    });

    await camera.init();
    
    cameras.push(camera);
  }
  return cameras;
};

const calculateBoundsOfAllScreenCameras = (screenCameras) => {
  let left = 0, right = 0, bottom = 0, top = 0;
  screenCameras.forEach(screenCamera => {
    if (screenCamera.props.rotation.z !== 0) {
      left = Math.min(screenCamera.object3D.position.x + screenCamera.object3D.bottom, left);
      right = Math.max(screenCamera.object3D.position.x + screenCamera.object3D.top, right);
      bottom = Math.min(screenCamera.object3D.position.y + screenCamera.object3D.left, bottom);
      top = Math.max(screenCamera.object3D.position.y + screenCamera.object3D.right, top);
    } else {
      left = Math.min(screenCamera.object3D.position.x + screenCamera.object3D.left, left);
      right = Math.max(screenCamera.object3D.position.x + screenCamera.object3D.right, right);
      bottom = Math.min(screenCamera.object3D.position.y + screenCamera.object3D.bottom, bottom);
      top = Math.max(screenCamera.object3D.position.y + screenCamera.object3D.top, top);
    }
  });
  const totalBounds = {
    width: right - left,
    height: top - bottom
  };
  totalBounds.x = left + (totalBounds.width / 2);
  totalBounds.y = bottom + (totalBounds.height / 2);
  return totalBounds;
}

export {
  getBoundsForSize,
  getSizeForBounds,
  createCamerasForConfig,
  calculateBoundsOfAllScreenCameras
}