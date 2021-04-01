import * as THREE from '../three.js/build/three.module.js';
import calculateScaleForView from './calculateScaleForView.js';
import loadImage from './loadImage.js';

const createTextureForPlane = async (planeConfig, screen, appConfig) => {
  const width = Math.floor( appConfig.appDimensions.width * screen.config.output.width );
  const height = Math.floor( appConfig.appDimensions.height * screen.config.output.height );
  if (planeConfig.type === 'video') {
    return new THREE.VideoTexture(video);
  }
  if (planeConfig.type === 'image') {
    const planeCanvas = new OffscreenCanvas(width, height);
    const planeCtx = planeCanvas.getContext('2d');
    // draw the image in the center of the plane
    const image = await loadImage(planeConfig.url);
    const offsetX = (width - image.width) / 2;
    const offsetY =(height - image.height) / 2;
    planeCtx.drawImage(image, offsetX, offsetY);
    return new THREE.CanvasTexture(planeCanvas);
  }
  // default: an empty canvas
  const planeCanvas = new OffscreenCanvas(width, height)
  return new THREE.CanvasTexture(planeCanvas);
};

const createPlaneForScreen = async (planeConfig, screen, appConfig) => {

  const texture = await createTextureForPlane(planeConfig, screen, appConfig);
  const material = new THREE.MeshBasicMaterial( { map: texture } );
  const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  const plane = new THREE.Mesh(planeGeometry, material);

  // place it on a certain config.screens camera
  plane.position.x = screen.camera.position.x;
  plane.position.y = screen.camera.position.y;

  const scale = calculateScaleForView(screen);
  plane.scale.set(scale.x, scale.y);

  const textureAspectRatio = scale.x / scale.y;
  const outputAspectRatio = screen.config.camera.size.width / screen.config.camera.size.height;
  texture.repeat.x = textureAspectRatio / outputAspectRatio;
  texture.offset.x = (1 - texture.repeat.x) / 2;

  plane.userData.planeConfig = planeConfig;

  return plane;
};

export default createPlaneForScreen;