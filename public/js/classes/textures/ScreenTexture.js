import calculateScaleForScreen from '../../functions/calculateScaleForScreen.js';
import * as THREE from '../../three.js/build/three.module.js';

class ScreenTexture {
  constructor({ userData, screenConfig, appConfig }) {
    this.userData = userData;
    this.screenConfig = screenConfig;
    this.appConfig = appConfig;

    this.width = Math.floor( appConfig.appDimensions.width * screenConfig.output.width );
    this.height = Math.floor( appConfig.appDimensions.height * screenConfig.output.height );
    this.maxSize = Math.max(this.width, this.height);

    this.canvas = new OffscreenCanvas(this.maxSize, this.maxSize);
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);

    this.layout();
  }

  layout() {
    const scale = calculateScaleForScreen(this.screenConfig);
    const textureAspectRatio = scale.x / scale.y;
    const isPortrait = textureAspectRatio < 1;
    let repeatX = 1;
    let repeatY = 1 / textureAspectRatio;
    if (isPortrait) {
      repeatX = textureAspectRatio;
      repeatY = 1;
    }
    this.texture.repeat.set(repeatX, repeatY);
    this.texture.offset.x = (repeatX - 1) * -0.5;
    this.texture.offset.y = (repeatY - 1) * -0.5;

    const x = isPortrait ? (this.width - this.height) / 2 : 0;
    const y = isPortrait ? 0 : (this.width - this.height) / 2;
  
    this.topLeft = {x, y};
    this.topRight = {x: this.width - x, y};
    this.bottomLeft = {x, y: (isPortrait) ? this.width : y + this.height};
    this.bottomRight = {x: this.width - x, y: (isPortrait) ? this.width : y + this.height};
  }

  async init() {
  }

  render() {
  }

  dispose() {
    this.texture.dispose();
  }
}

export { ScreenTexture }