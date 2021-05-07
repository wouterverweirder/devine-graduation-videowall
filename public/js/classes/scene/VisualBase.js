import * as THREE from '../../three.js/build/three.module.js';
import { SceneObject } from './SceneObject.js';

class VisualBase extends SceneObject {
  /**
   * 
   * @param {String} id Unique if for the visual
   * @param {Object} props { name, position, }
   */
  constructor(id = THREE.MathUtils.generateUUID(), props = {}) {
    const mergedProps = {
      name: 'visual',
      position:{
        x: 0,
        y: 0,
        z: 0
      },
      scale:{
        x: 16,
        y: 9
      },
      textureSize:{
        x: 1920,
        y: 1080
      }
    };
    Object.assign(mergedProps, props);
    props = mergedProps;
    super(id, props);
    this.type = 'visual';
  }

  async createMaterial() {
    return new THREE.MeshBasicMaterial( { color: 0xff0000 } );
  }

  async createGeometry() {
    return new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  }

  async createObject3D() {
    const material = await this.createMaterial();
    const geometry = await this.createGeometry();

    this.material = material;
    this.geometry = geometry;

    return new THREE.Mesh(geometry, material);
  }

  dispose() {
    this.material.dispose();
    this.geometry.dispose();
    super.dispose();
  }
}

export { VisualBase };