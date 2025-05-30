import * as THREE from 'three';
import { SceneObjectConfig } from '../../../types';
import { SceneObject, SceneObjectProps } from './SceneObject';

export type VisualBaseProps = SceneObjectProps & {
  color: number;
  textureSize: {
    x: number;
    y: number;
  };
}

export type OptionalVisualBaseProps = {
  [K in keyof VisualBaseProps]?: VisualBaseProps[K];
} & {
  [key: string]: unknown; // Allow additional properties
};

class VisualBase extends SceneObject {

  material: THREE.MeshBasicMaterial;
  geometry: THREE.BufferGeometry;
  objectConfig?: SceneObjectConfig;

  declare props:VisualBaseProps;

  /**
   * 
   * @param {String} id Unique if for the visual
   * @param {Object} props { name, position, }
   */
  constructor(id = THREE.MathUtils.generateUUID(), props:OptionalVisualBaseProps = {}) {
    super(id, {
      name: 'visual',
      color: 0xff0000,
      layers: false,
      position:{
        x: 0,
        y: 0,
        z: 0
      },
      scale:{
        x: 16,
        y: 9
      },
      anchor:{
        x: 0.5,
        y: 0.5
      },
      fixedRepeat:{
        x: 0,
        y: 0
      },
      textureSize:{
        x: 1920,
        y: 1080
      },
      ...props
    });
    this.type = 'visual';
  }

  async createMaterial():Promise<THREE.MeshBasicMaterial>  {
    return new THREE.MeshBasicMaterial( { color: this.props.color } );
  }

  async createGeometry():Promise<THREE.BufferGeometry> {
    return new THREE.PlaneGeometry(1, 1, 1, 1);
  }

  async createObject3D() {
    const material = await this.createMaterial();
    const geometry = await this.createGeometry();

    this.material = material;
    this.geometry = geometry;

    return new THREE.Mesh(geometry, material);
  }

  intro() {
  }

  dispose() {
    this.material.dispose();
    this.geometry.dispose();
    super.dispose();
  }
}

export { VisualBase };
