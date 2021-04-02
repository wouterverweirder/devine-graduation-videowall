import * as THREE from '../three.js/build/three.module.js';

const createCamerasForConfig = (config) => {
  const cameras = [];
  for ( let ii = 0; ii < config.screens.length; ++ ii ) {
    const screen = config.screens[ ii ];

    const size = screen.camera.size;

    const halfFrustrumSize = size.width / 2;
    const aspect = size.width / size.height;

    let rotation = 0;
    if (screen.camera.rotation) {
      rotation = screen.camera.rotation;
    }

    const left = 0.5 * halfFrustrumSize * aspect / - 1;
    const right = 0.5 * halfFrustrumSize * aspect;
    const top = halfFrustrumSize / 2;
    const bottom = halfFrustrumSize / - 2;
    const near = 1;
    const far = 30;
    
    const camera = new THREE.OrthographicCamera( left, right, top, bottom, near, far );
    camera.name = `Camera ${ii}`;
    camera.position.fromArray( screen.camera.position );
    camera.rotation.z = rotation;

    camera.userData.id = screen.id;
    camera.userData.planes = [];
    
    cameras.push(camera);
  }
  return cameras;
};

export default createCamerasForConfig;