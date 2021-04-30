import * as THREE from '../three.js/build/three.module.js';
import calculateScaleForScreen from './calculateScaleForScreen.js';
import loadImage from './loadImage.js';

const createTextureForPlane = async (userData, screenConfig, appConfig) => {
  const width = Math.floor( appConfig.appDimensions.width * screenConfig.output.width );
  const height = Math.floor( appConfig.appDimensions.height * screenConfig.output.height );
  const maxSize = Math.max(width, height);
  
  if (userData.type === 'video') {
    return new THREE.VideoTexture(video);
  }
  if (userData.type === 'image') {
    const planeCanvas = new OffscreenCanvas(maxSize, maxSize);
    const planeCtx = planeCanvas.getContext('2d');

    // draw the image in the center of the plane
    const image = await loadImage(userData.url);
    const offsetX = (maxSize - image.width) / 2;
    const offsetY = (maxSize - image.height) / 2;
    planeCtx.drawImage(image, offsetX, offsetY);

    return new THREE.CanvasTexture(planeCanvas);
  }
  // default: an empty canvas
  const planeCanvas = new OffscreenCanvas(maxSize, maxSize)
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

  // the texture size is a square - fill the plane proportionally instead of stretch
  const textureAspectRatio = scale.x / scale.y;
  let repeatX = 1;
  let repeatY = 1 / textureAspectRatio;
  if (textureAspectRatio < 1) {
    repeatX = textureAspectRatio * textureAspectRatio;
    repeatY = textureAspectRatio;
  }
  texture.repeat.set(repeatX, repeatY);
  texture.offset.x = (repeatX - 1) * -0.5;
  texture.offset.y = (repeatY - 1) * -0.5;

  Object.assign(plane.userData, userData);

  return plane;
};

export {
  createPlaneForScreen
};
  