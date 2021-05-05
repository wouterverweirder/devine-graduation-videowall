import { loadImage } from "../../functions/loadImage.js";
import { ScreenTexture } from "./ScreenTexture.js";

class ProjectAssetsTexture extends ScreenTexture {
  async init() {

    if (this.userData.data && this.userData.data.length > 0) {
      // // take the first image asset
      // const imageAssets = this.userData.data.filter(asset => asset.mime.includes('image'));
      // if (imageAssets.length > 0) {
      //   // draw the image in the center of the canvas
      //   const image = await loadImage(imageAssets[0].url);
      //   const offsetX = (this.canvas.width - image.width) / 2;
      //   const offsetY = (this.canvas.height - image.height) / 2;
      //   this.ctx.drawImage(image, offsetX, offsetY);
      // }
      const videoAssets = this.userData.data.filter(asset => asset.mime.includes('video'));
      if (videoAssets.length > 0) {
        const videoAsset = videoAssets[0];
        const video = document.createElement('video');
        video.autoplay = true;
        video.src = videoAsset.url;

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

    // ask for a texture update
    this.texture.needsUpdate = true;
  }

  dispose() {
    if (this.video) {
      const video = this.video;
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    super.dispose();
  }
}

export { ProjectAssetsTexture };