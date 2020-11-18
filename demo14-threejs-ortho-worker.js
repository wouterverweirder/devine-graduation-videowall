import * as THREE from './js/three.js/build/three.module.js';

const frustumSize = 10;
const halfFrustrumSize = 5;
const aspectRatio = 1920 / 1080;
const viewWidth = halfFrustrumSize * aspectRatio;

const views = [
  {
    left: 0,
    bottom: 0.5,
    width: 0.25,
    height: 0.5,
    eye: [ -viewWidth, halfFrustrumSize, 15 ],
  },
  {
    left: 0.25,
    bottom: 0.5,
    width: 0.25,
    height: 0.5,
    eye: [ 0, halfFrustrumSize, 15 ],
  },
  {
    left: 0.5,
    bottom: 0.5,
    width: 0.25,
    height: 0.5,
    eye: [ viewWidth, halfFrustrumSize, 15 ],
  },
  {
    left: 0.75,
    bottom: 0.5,
    width: 0.25,
    height: 0.5,
    eye: [ -viewWidth, 0, 15 ],
  },
  {
    left: 0,
    bottom: 0,
    width: 0.25,
    height: 0.5,
    eye: [ 0, 0, 15 ],
  },
  {
    left: 0.25,
    bottom: 0,
    width: 0.25,
    height: 0.5,
    eye: [ viewWidth, 0, 15 ],
  },
  {
    left: 0.5,
    bottom: 0,
    width: 0.25,
    height: 0.5,
    eye: [ -viewWidth/2, -halfFrustrumSize, 15 ],
  },
  {
    left: 0.75,
    bottom: 0,
    width: 0.25,
    height: 0.5,
    eye: [ viewWidth/2, -halfFrustrumSize, 15 ],
  }
];

let outputCanvas;
let renderer, scene;
let transitionMesh, planes;
let transitionScaleSpeed = -.01;
let lastCalledTime = 0, numFrames = 0;

let objectsByUserDataId = {};

const init = () => {
  renderer = new THREE.WebGLRenderer({canvas: outputCanvas, powerPreference: "high-performance"});
  scene = new THREE.Scene();

  const light = new THREE.AmbientLight( 0xffffff );
  scene.add(light);

  const transitionGeometry = new THREE.CircleGeometry(25, 45);
  const transitionMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0, 0) });
  transitionMesh = new THREE.Mesh(transitionGeometry, transitionMaterial);
  transitionMesh.position.z = 10;
  scene.add(transitionMesh);

  const planeGeometry = new THREE.PlaneGeometry(halfFrustrumSize * aspectRatio, halfFrustrumSize, 1, 1);

  planes = [];

  for ( let i = 0; i < views.length; ++ i ) {
    const view = views[ i ];
    const left = Math.floor( outputCanvas.width * view.left );
    const bottom = Math.floor( outputCanvas.height * view.bottom );
    const width = Math.floor( outputCanvas.width * view.width );
    const height = Math.floor( outputCanvas.height * view.height );

    const aspect = width / height;
    
    const camera = new THREE.OrthographicCamera( 0.5 * halfFrustrumSize * aspect / - 1, 0.5 * halfFrustrumSize * aspect, halfFrustrumSize / 2, halfFrustrumSize / - 2, 1, 30 );
    camera.userData.id = `camera-${i}`;
    camera.name = `Camera ${i}`;
    camera.position.fromArray( view.eye );
    view.camera = camera;

    objectsByUserDataId[camera.userData.id] = camera;

    postMessage({
      type: 'add-object',
      object: {
        type: 'orthographic-camera',
        name: camera.name,
        userData: camera.userData,
        parameters: {
          left: camera.left,
          right: camera.right,
          top: camera.top,
          bottom: camera.bottom,
          near: camera.near,
          far: camera.far,
        },
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        }
      }
    });

    view.background = new THREE.Color(1, 1, 1);

    // plane
    const planeCanvas = new OffscreenCanvas(width, height)
    const planeCtx = planeCanvas.getContext('2d');
    planeCtx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}`;
    planeCtx.fillRect(0, 0, planeCanvas.width, planeCanvas.height);

    // const texture = new THREE.TextureLoader().load( `assets/photo-0${i+1}.jpg` );
    const texture = new THREE.CanvasTexture(planeCanvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.MeshBasicMaterial( { map: texture } );

    const plane = new THREE.Mesh(planeGeometry, material);
    
    // place it on a certain views camera
    const targetView = views[i];
    plane.position.x = targetView.camera.position.x;
    plane.position.y = targetView.camera.position.y;
    
    plane.position.z = i;
    
    plane.userData.id = `screen-${i}`;
    plane.userData.targetX = plane.position.x;
    plane.userData.targetY = plane.position.y;
    
    planes.push(plane);
    scene.add(plane);

    objectsByUserDataId[plane.userData.id] = plane;
    postMessage({
      type: 'add-object',
      object: {
        type: 'plane',
        userData: plane.userData,
        geometry: {
          parameters: {
            width: planeGeometry.parameters.width,
            height: planeGeometry.parameters.height,
          }
        },
        position: {
          x: plane.position.x,
          y: plane.position.y,
          z: plane.position.z
        }
      }
    });
  }

  requestAnimationFrame(render);
};

const render = (time) => {
  numFrames++;

  const delta = (time - lastCalledTime) * 0.001;
  lastCalledTime = time;
  const fps = 1/delta;

  // console.log(Math.round(fps));

  if (numFrames % 120 === 0) {
    const viewsCopy = views.concat().sort(() => (Math.random() < .5) ? -1 : 1);
    planes.forEach((plane, i) => {
      const targetView = viewsCopy[i];
      plane.userData.targetX = targetView.camera.position.x;
      plane.userData.targetY = targetView.camera.position.y;
    });
  }

  const updatedObjectsData = [];

  planes.forEach((plane) => {

    const canvasTexture = plane.material.map;
    const planeCanvas = canvasTexture.image;
    const planeCtx = planeCanvas.getContext('2d');
    planeCtx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}`;
    planeCtx.fillRect(0, 0, planeCanvas.width, planeCanvas.height);
    canvasTexture.needsUpdate = true;

    plane.position.x += (plane.userData.targetX - plane.position.x) * 0.1;
    plane.position.y += (plane.userData.targetY - plane.position.y) * 0.1;

    postMessage({
      type: 'update-object',
      object: {
        userData: plane.userData,
        position: {
          x: plane.position.x,
          y: plane.position.y,
          z: plane.position.z
        }
      }
    });

  });

  // transitionMesh.visible = false;

  transitionMesh.scale.x += transitionScaleSpeed;
  transitionMesh.scale.y += transitionScaleSpeed;
  if (transitionMesh.scale.x <= 0) {
    transitionScaleSpeed = Math.abs(transitionScaleSpeed);
  } else if (transitionMesh.scale.x > 1) {
    transitionScaleSpeed = -Math.abs(transitionScaleSpeed);
  }

  for ( let ii = 0; ii < views.length; ++ ii ) {

    const view = views[ ii ];
    const camera = view.camera;

    const left = Math.floor( outputCanvas.width * view.left );
    const bottom = Math.floor( outputCanvas.height * view.bottom );
    const width = Math.floor( outputCanvas.width * view.width );
    const height = Math.floor( outputCanvas.height * view.height );

    renderer.setViewport( left, bottom, width, height );
    renderer.setScissor( left, bottom, width, height );
    renderer.setScissorTest( true );
    renderer.setClearColor( view.background );

    renderer.render( scene, camera );

  }

  requestAnimationFrame(render);
};

const handleUpdateObject = (message) => {
  const objectData = message.object;
  const object = objectsByUserDataId[objectData.userData.id];
  if (!object) {
    return;
  }
  object.position.set(objectData.position.x, objectData.position.y, objectData.position.z);
};

addEventListener('message', e => {
  if (e.data.type === 'init') {
    outputCanvas = e.data.outputCanvas;
    init();
  } else if (e.data.type === 'update-object') {
    handleUpdateObject(e.data);
  }
});