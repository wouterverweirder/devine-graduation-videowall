import * as THREE from '../../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";

class CircleAnimationPlane extends VisualBase {

  _progress = 0;

  async createMaterial() {
    return new THREE.MeshBasicMaterial( { color: 0xffffff } );
  }

  async createGeometry() {
    return new THREE.TorusGeometry(1, .3, 2, 64);
  }

  get progress() {
    return this._progress;
  }

  set progress(value) {
    this._progress = value;
    this.applyProps({
      scale: {
        x: this._progress * 3,
        y: this._progress * 3
      }
    })
  }
}

export { CircleAnimationPlane }