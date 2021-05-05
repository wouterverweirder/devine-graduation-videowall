import { loadImage } from "../../functions/loadImage.js";
import { ScreenTexture } from "./ScreenTexture.js";

class BasicImageTexture extends ScreenTexture {
  async init() {
    // draw the image in the center of the canvas
    const image = await loadImage(this.userData.url);
    const offsetX = (this.canvas.width - image.width) / 2;
    const offsetY = (this.canvas.height - image.height) / 2;
    this.ctx.drawImage(image, offsetX, offsetY);

    // ask for a texture update
    this.texture.needsUpdate = true;
  }
}

export { BasicImageTexture };