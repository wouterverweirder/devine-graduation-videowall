import * as THREE from '../three.js/build/three.module.js';
import calculateScaleForView from './calculateScaleForView.js';
import loadImage from './loadImage.js';

const createPlaneForView = async (planeConfig, view, appConfig) => {

  const width = Math.floor( appConfig.appDimensions.width * view.config.output.width );
  const height = Math.floor( appConfig.appDimensions.height * view.config.output.height );

  let texture;
  let textureType = planeConfig.type;

  if (textureType === 'video') {
    texture = new THREE.VideoTexture(video1.$video);
  } else if (textureType === 'image') {
    // texture = new THREE.TextureLoader().load( planeConfig.url );
    const planeCanvas = new OffscreenCanvas(width, height)
    const planeCtx = planeCanvas.getContext('2d');
    // draw the image in the center of the plane
    const image = await loadImage(planeConfig.url);
    const offsetX = (width - image.width) / 2;
    const offsetY =(height - image.height) / 2;
    planeCtx.drawImage(image, offsetX, offsetY);
    texture = new THREE.CanvasTexture(planeCanvas);
  } else {
    const planeCanvas = new OffscreenCanvas(width, height)
    const planeCtx = planeCanvas.getContext('2d');
    planeCtx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}`;
    planeCtx.fillRect(0, 0, planeCanvas.width, planeCanvas.height);
    texture = new THREE.CanvasTexture(planeCanvas);
  }
  const material = new THREE.MeshBasicMaterial( { map: texture } );
  const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  const plane = new THREE.Mesh(planeGeometry, material);

  // place it on a certain config.views camera
  plane.position.x = view.camera.position.x;
  plane.position.y = view.camera.position.y;

  const scale = calculateScaleForView(view);
  plane.scale.set(scale.x, scale.y);
  
  const textureAspectRatio = scale.x / scale.y;
  const outputAspectRatio = view.config.output.height / view.config.output.width;
  texture.repeat.x = textureAspectRatio / outputAspectRatio;
  texture.offset.x = (1 - texture.repeat.x) / 2;

  plane.userData.textureType = textureType;
  plane.userData.targetX = plane.position.x;
  plane.userData.targetY = plane.position.y;
  plane.userData.targetScaleX = plane.scale.x;
  plane.userData.targetScaleY = plane.scale.y;
  plane.userData.targetTextureRepeatX = texture.repeat.x;
  plane.userData.targetTextureOffsetX = texture.offset.x;

  return plane;
};

export default createPlaneForView;