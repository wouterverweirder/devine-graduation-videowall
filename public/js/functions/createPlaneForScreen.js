import * as THREE from '../three.js/build/three.module.js';
import calculateScaleForScreen from './calculateScaleForScreen.js';
import loadImage from './loadImage.js';

const createTextureForPlane = async (userData, screenConfig, appConfig) => {
  const width = Math.floor( appConfig.appDimensions.width * screenConfig.output.width );
  const height = Math.floor( appConfig.appDimensions.height * screenConfig.output.height );
  if (userData.type === 'video') {
    return new THREE.VideoTexture(video);
  }
  if (userData.type === 'image') {
    const planeCanvas = new OffscreenCanvas(width, height);
    const planeCtx = planeCanvas.getContext('2d');
    // draw the image in the center of the plane
    const image = await loadImage(userData.url);
    const offsetX = (width - image.width) / 2;
    const offsetY =(height - image.height) / 2;
    planeCtx.drawImage(image, offsetX, offsetY);
    return new THREE.CanvasTexture(planeCanvas);
  }
  // default: an empty canvas
  const planeCanvas = new OffscreenCanvas(width, height)
  return new THREE.CanvasTexture(planeCanvas);
};

const createPlaneForScreen = async ({userData, screenConfig, appConfig}) => {

  const texture = await createTextureForPlane(userData, screenConfig, appConfig);
  const material = new THREE.MeshBasicMaterial( { map: texture } );
  const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  const plane = new THREE.Mesh(planeGeometry, material);

  plane.name = `${userData.type} plane ${screenConfig.id}`;

  // place it on a certain config.screens camera
  plane.position.x = screenConfig.camera.position[0];
  plane.position.y = screenConfig.camera.position[1];

  const scale = calculateScaleForScreen(screenConfig);
  plane.scale.set(scale.x, scale.y);

  const textureAspectRatio = scale.x / scale.y;
  const outputAspectRatio = screenConfig.camera.size.width / screenConfig.camera.size.height;
  texture.repeat.x = textureAspectRatio / outputAspectRatio;
  texture.offset.x = (1 - texture.repeat.x) / 2;

  Object.assign(plane.userData, userData);

  return plane;
};

export {
  createPlaneForScreen
};
  