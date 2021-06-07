import * as THREE from '../../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";
import { loadImage } from "../../../functions/loadImage.js";

import { setTextureRepeatAndOffset } from "../../../functions/setTextureRepeatAndOffset.js";

class ImagePlane extends VisualBase {
  async createMaterial() {

    const image = await loadImage(this.props.url);
    const texture = new THREE.Texture(image);

    setTextureRepeatAndOffset(texture, image, this.props);

    const isJPEG = this.props.url.search( /\.jpe?g($|\?)/i ) > 0 || this.props.url.search( /^data\:image\/jpeg/ ) === 0;
    texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat;
    texture.needsUpdate = true;

    return new THREE.MeshBasicMaterial( { map: texture } );
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
    this.material.map.dispose();
    // this.texture.dispose();
    super.dispose();
  }
}

export { ImagePlane }