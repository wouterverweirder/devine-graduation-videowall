import * as THREE from '../three.js/build/three.module.js';
import calculateScaleForScreen from './calculateScaleForScreen.js';
import { BasicImageTexture } from '../classes/textures/BasicImageTexture.js';
import { ProjectDescriptionTexture } from '../classes/textures/ProjectDescriptionTexture.js';
import { ProjectAssetsTexture } from '../classes/textures/ProjectAssetsTexture.js';
import { ProjectStudentTexture } from '../classes/textures/ProjectStudentTexture.js';

const createTextureForPlane = async (userData, screenConfig, appConfig) => {

  if (userData.type === 'image') {
    return new BasicImageTexture({ userData, screenConfig, appConfig });
  }
  if (userData.type === 'project-description') {
    return new ProjectDescriptionTexture({ userData, screenConfig, appConfig });
  }
  if (userData.type === 'project-assets') {
    return new ProjectAssetsTexture({ userData, screenConfig, appConfig });
  }
  if (userData.type === 'project-student') {
    return new ProjectStudentTexture({ userData, screenConfig, appConfig });
  }
};

const createPlaneForScreen = async ({userData, screenConfig, appConfig}) => {

  const texture = await createTextureForPlane(userData, screenConfig, appConfig);
  if (texture.init) {
    await texture.init();
  }

  const material = new THREE.MeshBasicMaterial( { map: texture.texture } );
  const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  const plane = new THREE.Mesh(planeGeometry, material);

  plane.name = `${userData.type} plane ${screenConfig.id}`;

  // place it on a certain config.screens camera
  plane.position.x = screenConfig.camera.position[0];
  plane.position.y = screenConfig.camera.position[1];

  const scale = calculateScaleForScreen(screenConfig);
  plane.scale.set(scale.x, scale.y);

  Object.assign(plane.userData, userData);

  if (!plane.userData.render) {
    plane.userData.render = () => {
      texture.render();
    };
  }
  if (!plane.userData.dispose) {
    plane.userData.dispose = () => {
      texture.dispose();
      material.dispose();
      planeGeometry.dispose();
    };
  }

  return plane;
};

export {
  createPlaneForScreen
};
  