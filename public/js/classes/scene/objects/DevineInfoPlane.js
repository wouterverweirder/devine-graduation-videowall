import { CanvasPlane } from "./CanvasPlane.js";
import { gsap, Cubic } from '../../../gsap/src/index.js';
import { getLines } from '../../../functions/getLines.js';

class DevineInfoPlane extends CanvasPlane {

  canvasObjects = [];
  tl = false;

  async createInitalCanvasContent() {
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 50;

    const fontSize = 130;
    const lineHeight = 150;

    let yPos = fontSize + marginTop;

    const bachelor = {
      type: 'text',
      font: `${fontSize}px "Embedded Space Grotesk"`,
      fillStyle: 'white',
      content: 'Bachelor',
      x: marginLeft,
      y: yPos,
      opacity: 0
    };
    yPos += lineHeight;

    const digitalDesignAnd = {
      type: 'text',
      font: `${fontSize}px "Embedded Space Grotesk"`,
      fillStyle: 'white',
      content: 'Digital Design &',
      x: marginLeft,
      y: yPos,
      opacity: 0
    };
    yPos += lineHeight;

    const development = {
      type: 'text',
      font: `${fontSize}px "Embedded Space Grotesk"`,
      fillStyle: 'white',
      content: 'Development',
      x: marginLeft,
      y: yPos,
      opacity: 0
    };
    yPos += lineHeight;

    this.canvasObjects.push(bachelor);
    this.canvasObjects.push(digitalDesignAnd);
    this.canvasObjects.push(development);
  }

  draw() {
    // draw my basic displaylist to the screen
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasObjects.forEach(canvasObject => {
      if (canvasObject.type === 'text') {
        this.ctx.save();
        this.ctx.globalAlpha = canvasObject.opacity;
        this.ctx.fillStyle = canvasObject.fillStyle;
        this.ctx.font = canvasObject.font;
        this.ctx.fillText(canvasObject.content, canvasObject.x, canvasObject.y );
        this.ctx.restore();
      }
    });
    this.texture.needsUpdate = true;
  }

  intro() {
    // setup timeline
    this.tl = gsap.timeline({
      onUpdate: () => {
        this.draw();
      }
    });
    const maxDelay = 0.5;
    this.canvasObjects.forEach((canvasObject, index) => {
      const delay = Cubic.easeInOut(index / this.canvasObjects.length) * maxDelay;
      this.tl.to(canvasObject, { y: canvasObject.y, opacity: 1, delay, duration: 0.5, ease: Cubic.easeInOut }, 0);
      canvasObject.y = canvasObject.y + 100;
    });
  }

  dispose() {
    if (this.tl) {
      this.tl.kill();
    }
    super.dispose();
  }
}

export { DevineInfoPlane }