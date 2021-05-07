import * as THREE from '../../three.js/build/three.module.js';
import { SceneObject } from "./SceneObject.js";

class ScreenCamera extends SceneObject {
  constructor(id = THREE.MathUtils.generateUUID(), props = {}) {
    const mergedProps = {
      name: 'screen',
      position: {
        x: 0,
        y: 0,
        z: 0
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    Object.assign(mergedProps, props);
    props = mergedProps;
    super(id, props);
    this.type = 'camera';
  }

  async createObject3D() {
    const near = 0;
    const far = 2;
    return new THREE.OrthographicCamera( this.props.left, this.props.right, this.props.top, this.props.bottom, near, far );
  }

  applyProps(newProps) {
    if (newProps.left) {
      this.object3D.left = this.props.left = newProps.left;
    }
    if (newProps.right) {
      this.object3D.right = this.props.right = newProps.right;
    }
    if (newProps.top) {
      this.object3D.top = this.props.top = newProps.top;
    }
    if (newProps.bottom) {
      this.object3D.bottom = this.props.bottom = newProps.bottom;
    }
    this.object3D.updateProjectionMatrix();
    super.applyProps(newProps);
  }
}

export { ScreenCamera }