import * as THREE from '../../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";

import { setTextureRepeatAndOffset } from "../../../functions/setTextureRepeatAndOffset.js";

class VideoPlane extends VisualBase {
  async createMaterial() {

    const video = document.createElement('video');
    this.video = video;

    video.autoplay = true;
    video.loop = true;
    video.muted = true; // tmp set to muted
    const texture = new THREE.VideoTexture(video);

    video.requestVideoFrameCallback(() => {
      // first frame, set correct size
      setTextureRepeatAndOffset(texture, video, this.props);
    });
    video.src = this.props.url;
    return new THREE.MeshBasicMaterial( { map: texture } )
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
    if (this.video) {
      const video = this.video;
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    this.material.map.dispose();
    super.dispose();
  }
}

export { VideoPlane }