import * as THREE from '../../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";

import { setTextureRepeatAndOffset } from "../../../functions/setTextureRepeatAndOffset.js";

class CanvasPlane extends VisualBase {

  async createMaterial() {

    const canvas = new OffscreenCanvas(this.props.textureSize.x, this.props.textureSize.y);
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);

    setTextureRepeatAndOffset(texture, canvas, this.props);

    this.canvas = canvas;
    this.ctx = ctx;
    this.texture = texture;

    await this.createInitalCanvasContent();

    return new THREE.MeshBasicMaterial( { map: texture } );
  }

  async createInitalCanvasContent() {
  }

  applyProps(newProps) {
    super.applyProps(newProps);
    if (newProps.scale || newProps.anchor) {
      const texture = this.material.map;
      const image = texture.image;
      setTextureRepeatAndOffset(texture, image, this.props);
    }
  }

  dispose() {
    this.texture.dispose();
    super.dispose();
  }
}

export { CanvasPlane }