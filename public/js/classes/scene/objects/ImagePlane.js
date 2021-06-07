import * as THREE from '../../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";
import { loadImage } from "../../../functions/loadImage.js";

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

    let fixedRepeatX = this.props.fixedRepeat.x;
    let fixedRepeatY = this.props.fixedRepeat.y;
    let repeatX, repeatY;
    let setRepeatXFromRepeatY = false;
    let setRepeatYFromRepeatX = false;

    repeatX = w * h2 / (h * w2);
    setRepeatXFromRepeatY = false;
    setRepeatYFromRepeatX = true;
    if (repeatX > 1) {
      repeatX = 1;
      setRepeatXFromRepeatY = false;
      setRepeatYFromRepeatX = true;
    } else if (repeatY > 1) {
      repeatY = 1;
      setRepeatXFromRepeatY = true;
      setRepeatYFromRepeatX = false;
    }
    if (fixedRepeatX) {
      repeatX = fixedRepeatX;
      setRepeatXFromRepeatY = false;
      setRepeatYFromRepeatX = true;
    }
    if (fixedRepeatY) {
      repeatY = fixedRepeatY;
      setRepeatXFromRepeatY = true;
      setRepeatYFromRepeatX = false;
    }

    if (setRepeatYFromRepeatX) {
      repeatY = repeatX * h * w2 / (w * h2);
    }
    if (setRepeatXFromRepeatY) {
      repeatX = repeatY * w * h2 / (h * w2);
    }
    
    texture.repeat.set(repeatX, repeatY);
    texture.offset.x = (repeatX - 1) * this.props.anchor.x * -1;
    texture.offset.y = (repeatY - 1) * (1 - this.props.anchor.y) * -1;
  }

  applyProps(newProps) {
    super.applyProps(newProps);
    if (newProps.scale || newProps.anchor) {
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