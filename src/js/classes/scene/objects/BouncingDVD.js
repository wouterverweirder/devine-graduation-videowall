import { loadImage } from "../../../functions/loadImage.js";
import { CanvasPlane } from "./CanvasPlane.js";

class BouncingDVD extends CanvasPlane {

  screenConfig;

  async createInitalCanvasContent() {
    this.transparent = true;
    this.hueAngle = 0;
    this.dvdImage = await loadImage('assets/dvd-logo.png');
    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.filter = 'hue-rotate(' + this.hueAngle + 'deg)';
    this.ctx.drawImage(this.dvdImage, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.texture.needsUpdate = true;
  }

  render() {
    const velocity = this.props.velocity;
    const screenConfig = this.props.screenConfig;
    const scale = this.props.scale;
    let changeColor = false;
    // is screen vertical?
    const isScreenVertical = screenConfig.camera.rotation !== 0;
    const minX = screenConfig.camera.position[0] - (screenConfig.camera.size[isScreenVertical ? 'height' : 'width'] / 2);
    const maxX = screenConfig.camera.position[0] + screenConfig.camera.size[isScreenVertical ? 'height' : 'width'] / 2;
    const minY = screenConfig.camera.position[1] - screenConfig.camera.size[isScreenVertical ? 'width' : 'height'] / 2;
    const maxY = screenConfig.camera.position[1] + screenConfig.camera.size[isScreenVertical ? 'width' : 'height'] / 2;
    if (this.props.position.x - scale.x / 2 < minX) {
      velocity.x = Math.abs(velocity.x);
      changeColor = true;
    }
    if (this.props.position.x + scale.x / 2 > maxX) {
      velocity.x = -Math.abs(velocity.x);
      changeColor = true;
    }
    if (this.props.position.y - scale.y / 2 < minY) {
      velocity.y = Math.abs(velocity.y);
      changeColor = true;
    }
    if (this.props.position.y + scale.y / 2 > maxY) {
      velocity.y = -Math.abs(velocity.y);
      changeColor = true;
    }
    if (changeColor) {
      this.hueAngle += (45 * 3);
      this.draw();
    }
    this.applyProps({
      position: {
        x: this.props.position.x + velocity.x,
        y: this.props.position.y + velocity.y,
        z: 0
      },
      velocity
    });
  }
}

export { BouncingDVD };