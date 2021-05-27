import * as THREE from '../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";
import { loadImage } from "../../functions/loadImage.js";

class ProjectAssetsPlane extends VisualBase {
  async createMaterial() {

    const canvas = new OffscreenCanvas(this.props.textureSize.x, this.props.textureSize.y);
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);

    this.canvas = canvas;
    this.ctx = ctx;
    this.texture = texture;

    if (this.props.data && this.props.data.length > 0) {
      // take the first asset
      const asset = this.props.data[0];
      const isImage = asset.mime.includes('image');
      const isVideo = asset.mime.includes('video');
      if (isImage) {
        // draw the image in the center of the canvas
        const image = await loadImage(asset.url);
        const offsetX = (this.canvas.width - image.width) / 2;
        const offsetY = (this.canvas.height - image.height) / 2;
        this.ctx.drawImage(image, offsetX, offsetY);
      } else if (isVideo) {
        const video = document.createElement('video');
        video.autoplay = true;
        video.loop = true;
        video.muted = true; // tmp set to muted
        video.src = asset.url;

        const updateVideo = () => {

          const offsetX = (this.canvas.width - video.videoWidth) / 2;
          const offsetY = (this.canvas.height - video.videoHeight) / 2;
          this.ctx.drawImage(video, offsetX, offsetY);

          this.texture.needsUpdate = true;
          video.requestVideoFrameCallback( updateVideo );
        }

        if ( 'requestVideoFrameCallback' in video ) {
          video.requestVideoFrameCallback( updateVideo );
        }

        this.video = video;
      }
    }

    return new THREE.MeshBasicMaterial( { map: texture } );
  }

  dispose() {
    if (this.video) {
      const video = this.video;
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    this.texture.dispose();
    super.dispose();
  }
}

export { ProjectAssetsPlane }