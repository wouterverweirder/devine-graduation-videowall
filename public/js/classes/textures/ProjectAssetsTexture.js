import { loadImage } from "../../functions/loadImage.js";
import { ScreenTexture } from "./ScreenTexture.js";

class ProjectAssetsTexture extends ScreenTexture {
  async init() {

    if (this.userData.data && this.userData.data.length > 0) {
      // take the first asset
      const asset = this.userData.data[0];
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
    // call super dispose for texture itself
    super.dispose();
  }
}

export { ProjectAssetsTexture };