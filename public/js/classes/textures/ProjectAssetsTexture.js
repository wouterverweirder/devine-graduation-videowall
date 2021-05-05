import { loadImage } from "../../functions/loadImage.js";
import { ScreenTexture } from "./ScreenTexture.js";

class ProjectAssetsTexture extends ScreenTexture {
  async init() {

    if (this.userData.data && this.userData.data.length > 0) {
      // take the first image asset
      const imageAssets = this.userData.data.filter(asset => asset.mime.includes('image'));
      if (imageAssets.length > 0) {
        // draw the image in the center of the canvas
        const image = await loadImage(imageAssets[0].url);
        const offsetX = (this.canvas.width - image.width) / 2;
        const offsetY = (this.canvas.height - image.height) / 2;
        this.ctx.drawImage(image, offsetX, offsetY);
      }
    }

    // ask for a texture update
    this.texture.needsUpdate = true;
  }
}

export { ProjectAssetsTexture };