import * as THREE from '../three.js/build/three.module.js';

const createCamerasForConfig = (config) => {
  for ( let ii = 0; ii < config.screens.length; ++ ii ) {
    const screen = config.screens[ ii ];

    const size = screen.config.camera.size;

    const halfFrustrumSize = size.width / 2;
    const aspect = size.width / size.height;

    let rotation = 0;
    if (screen.config.camera.rotation) {
      rotation = screen.config.camera.rotation;
    }

    const left = 0.5 * halfFrustrumSize * aspect / - 1;
    const right = 0.5 * halfFrustrumSize * aspect;
    const top = halfFrustrumSize / 2;
    const bottom = halfFrustrumSize / - 2;
    const near = 1;
    const far = 30;
    
    const camera = new THREE.OrthographicCamera( left, right, top, bottom, near, far );
    camera.name = `Camera ${ii}`;
    camera.position.fromArray( screen.config.camera.position );
    camera.rotation.z = rotation;
    screen.camera = camera;

    screen.background = new THREE.Color(1, 1, 1);
  }
};

export default createCamerasForConfig;