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

const createCamerasForConfig = (config) => {
  const cameras = [];
  for ( let ii = 0; ii < config.screens.length; ++ ii ) {
    const screen = config.screens[ ii ];

    const bounds = getBoundsForSize(screen.camera.size);
    let rotation = 0;
    if (screen.camera.rotation) {
      rotation = screen.camera.rotation;
    }

    const near = 1;
    const far = 30;
    
    const camera = new THREE.OrthographicCamera( bounds.left, bounds.right, bounds.top, bounds.bottom, near, far );
    camera.name = `Screen ${ii}`;
    camera.position.fromArray( screen.camera.position );
    camera.rotation.z = rotation;

    Object.assign(camera.userData, screen);
    camera.userData.type = 'screen';
    
    cameras.push(camera);
  }
  return cameras;
};

export {
  getBoundsForSize,
  getSizeForBounds,
  createCamerasForConfig
}