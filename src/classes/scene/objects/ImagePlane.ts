import * as THREE from 'three';
import { VisualBase, VisualBaseProps } from "./VisualBase";
import { loadImage, PromiseWithCancel } from "../../../functions/loadImage";

import { setTextureRepeatAndOffset } from "../../../functions/setTextureRepeatAndOffset";
import { getExpressURLIfNeeded } from '../../../functions/getExpressURLIfNeeded';

export type ImagePlaneProps = VisualBaseProps & {
  url?: string;
};

class ImagePlane extends VisualBase {

  texture: THREE.Texture | null = null;
  transparent = false;
  imageLoad:PromiseWithCancel<HTMLImageElement> = null;

  declare props: ImagePlaneProps;
  
  async createMaterial() {

    let image, texture, material;
    if (this.props.url) {
      try {
        this.imageLoad = loadImage(getExpressURLIfNeeded(this.props.url));
        image = await this.imageLoad;
        texture = new THREE.Texture(image);
        setTextureRepeatAndOffset(texture, image, this.props);
        const isJPEG = this.props.url.search( /\.jpe?g($|\?)/i ) > 0 || this.props.url.search( /^data:image\/jpeg/ ) === 0;
        // texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat;
        this.transparent = !isJPEG;
        texture.needsUpdate = true;
        material = new THREE.MeshBasicMaterial( { map: texture, transparent: this.transparent } );
      } catch (error) {
        console.error(error);
        material = new THREE.MeshBasicMaterial( {} );
      }
    } else {
      material = new THREE.MeshBasicMaterial( {} );
    }

    return material;
  }

  applyProps(newProps:VisualBaseProps) {
    super.applyProps(newProps);
    if ((newProps.scale || newProps.anchor) && this.material.map) {
      const texture = this.material.map;
      const image = texture.image;
      setTextureRepeatAndOffset(texture, image, this.props);
    }
  }

  dispose() {
    console.log('ImagePlane.dispose()');
    if (this.imageLoad) {
      this.imageLoad.cancel();
    }
    if (this.material.map) {
      this.material.map.dispose();
    }
    // this.texture.dispose();
    super.dispose();
  }
}

export { ImagePlane }