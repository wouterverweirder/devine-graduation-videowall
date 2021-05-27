import * as THREE from '../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";
import { loadImage } from "../../functions/loadImage.js";

class ImagePlane extends VisualBase {
  async createMaterial() {

    const image = await loadImage(this.props.url);
    const texture = new THREE.Texture(image);

    this.setTextureRepeatAndOffset(texture, image);

    const isJPEG = this.props.url.search( /\.jpe?g($|\?)/i ) > 0 || this.props.url.search( /^data\:image\/jpeg/ ) === 0;
    texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat;
    texture.needsUpdate = true;

    return new THREE.MeshBasicMaterial( { map: texture } );
  } 

  setTextureRepeatAndOffset(texture, image) {
    const w = this.props.scale.x;
    const h = this.props.scale.y;
    const w2 = image.width;
    const h2 = image.height;

    let repeatX, repeatY;
    repeatX = w * h2 / (h * w2);
    if (repeatX > 1) {
      //fill the width and adjust the height accordingly
      repeatX = 1;
      repeatY = h * w2 / (w * h2);
      texture.repeat.set(repeatX, repeatY);
      texture.offset.y = (repeatY - 1) / 2 * -1;
    } else {
      //fill the height and adjust the width accordingly
      repeatX = w * h2 / (h * w2);
      repeatY = 1;
      texture.repeat.set(repeatX, repeatY);
      texture.offset.x = (repeatX - 1) / 2 * -1;
    }
  }

  applyProps(newProps) {
    super.applyProps(newProps);
    if (newProps.scale) {
      const texture = this.material.map;
      const image = texture.image;
      this.setTextureRepeatAndOffset(texture, image);
    }
  }

  dispose() {
    this.material.map.dispose();
    // this.texture.dispose();
    super.dispose();
  }
}

export { ImagePlane }