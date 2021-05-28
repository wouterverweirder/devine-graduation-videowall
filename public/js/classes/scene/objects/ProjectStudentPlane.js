import * as THREE from '../../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";
import { loadImage } from "../../../functions/loadImage.js";

class ProjectStudentPlane extends VisualBase {
  async createMaterial() {

    const canvas = new OffscreenCanvas(this.props.textureSize.x, this.props.textureSize.y);
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);

    this.texture = texture;

    // draw the image in the center of the canvas
    const image = await loadImage(this.props.data.profilePicture.url);
    const offsetX = (canvas.width - image.width) / 2;
    const offsetY = (canvas.height - image.height) / 2;
    ctx.drawImage(image, offsetX, offsetY);


    return new THREE.MeshBasicMaterial( { map: texture } );
  }

  dispose() {
    this.texture.dispose();
    super.dispose();
  }
}

export { ProjectStudentPlane }