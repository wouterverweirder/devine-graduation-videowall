import * as THREE from '../three.js/build/three.module.js';

const createCamerasForConfig = (config) => {
  for ( let ii = 0; ii < config.views.length; ++ ii ) {
    const view = config.views[ ii ];

    const size = view.config.camera.size;

    const halfFrustrumSize = size.width / 2;
    const aspect = size.width / size.height;

    let rotation = 0;
    if (view.config.camera.rotation) {
      rotation = view.config.camera.rotation;
    }

    const left = 0.5 * halfFrustrumSize * aspect / - 1;
    const right = 0.5 * halfFrustrumSize * aspect;
    const top = halfFrustrumSize / 2;
    const bottom = halfFrustrumSize / - 2;
    const near = 1;
    const far = 30;
    
    const camera = new THREE.OrthographicCamera( left, right, top, bottom, near, far );
    camera.name = `Camera ${ii}`;
    camera.position.fromArray( view.config.camera.position );
    camera.rotation.z = rotation;
    view.camera = camera;

    view.background = new THREE.Color(1, 1, 1);
  }
};

export default createCamerasForConfig;