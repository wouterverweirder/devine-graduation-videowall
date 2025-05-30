import * as THREE from 'three';
import { VisualBase } from "./VisualBase";

import { setTextureRepeatAndOffset } from "../../../functions/setTextureRepeatAndOffset";
import { OptionalSceneObjectProps } from './SceneObject';

class CanvasPlane extends VisualBase {

  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;

  transparent = false;

  async createMaterial() {

    const canvas = new OffscreenCanvas(this.props.textureSize.x, this.props.textureSize.y);
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);

    setTextureRepeatAndOffset(texture, canvas, this.props);

    this.canvas = canvas;
    this.ctx = ctx;
    this.texture = texture;

    await this.createInitalCanvasContent();

    return new THREE.MeshBasicMaterial( { map: texture, transparent: this.transparent } );
  }

  async createInitalCanvasContent() {
  }

  applyProps(newProps:OptionalSceneObjectProps) {
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

export { CanvasPlane };
