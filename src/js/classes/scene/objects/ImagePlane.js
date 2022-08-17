import * as THREE from '../../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";
import { loadImage } from "../../../functions/loadImage.js";

import { setTextureRepeatAndOffset } from "../../../functions/setTextureRepeatAndOffset.js";

class ImagePlane extends VisualBase {
  async createMaterial() {

    let image, texture, material;
    if (this.props.url) {
      try {
        image = await loadImage(this.props.url);
        texture = new THREE.Texture(image);
        setTextureRepeatAndOffset(texture, image, this.props);
        const isJPEG = this.props.url.search( /\.jpe?g($|\?)/i ) > 0 || this.props.url.search( /^data\:image\/jpeg/ ) === 0;
        texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat;
        texture.needsUpdate = true;
        material = new THREE.MeshBasicMaterial( { map: texture } );
      } catch (error) {
        console.error(error);
        material = new THREE.MeshBasicMaterial( {} );
      }
    } else {
      material = new THREE.MeshBasicMaterial( {} );
    }

    return material;
  }

  applyProps(newProps) {
    super.applyProps(newProps);
    if ((newProps.scale || newProps.anchor) && this.material.map) {
      const texture = this.material.map;
      const image = texture.image;
      setTextureRepeatAndOffset(texture, image, this.props);
    }
  }

  dispose() {
    if (this.material.map) {
      this.material.map.dispose();
    }
    // this.texture.dispose();
    super.dispose();
  }
}

export { ImagePlane }