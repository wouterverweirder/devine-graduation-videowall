import * as THREE from '../three.js/build/three.module.js';
import calculateScaleForView from './calculateScaleForView.js';
import loadImage from './loadImage.js';

const createTextureForPlane = async (planeConfig, view, appConfig) => {
  const width = Math.floor( appConfig.appDimensions.width * view.config.output.width );
  const height = Math.floor( appConfig.appDimensions.height * view.config.output.height );
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

const createPlaneForView = async (planeConfig, view, appConfig) => {

  const texture = await createTextureForPlane(planeConfig, view, appConfig);
  const material = new THREE.MeshBasicMaterial( { map: texture } );
  const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  const plane = new THREE.Mesh(planeGeometry, material);

  // place it on a certain config.views camera
  plane.position.x = view.camera.position.x;
  plane.position.y = view.camera.position.y;

  const scale = calculateScaleForView(view);
  plane.scale.set(scale.x, scale.y);

  const textureAspectRatio = scale.x / scale.y;
  const outputAspectRatio = view.config.camera.size.width / view.config.camera.size.height;
  texture.repeat.x = textureAspectRatio / outputAspectRatio;
  texture.offset.x = (1 - texture.repeat.x) / 2;

  plane.userData.planeConfig = planeConfig;

  return plane;
};

export default createPlaneForView;