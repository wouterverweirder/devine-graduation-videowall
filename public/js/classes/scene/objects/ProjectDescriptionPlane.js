import { CanvasPlane } from "./CanvasPlane.js";
import { gsap, Cubic } from '../../../gsap/src/index.js';
import { getLines } from '../../../functions/getLines.js';

class ProjectDescriptionPlane extends CanvasPlane {

  canvasObjects = [];
  tl = false;

  async createInitalCanvasContent() {
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 50;

    const fontSize = 55;
    const lineHeight = 70;

    let yPos = fontSize + marginTop;

    this.canvasObjects.push({
      type: 'text',
      font: `${fontSize}px "Embedded Space Grotesk"`,
      fillStyle: 'white',
      content: 'Project Info',
      x: marginLeft,
      y: yPos,
      opacity: 0
    });

    yPos += 200;

    const paragraphs = this.props.data.description.split("\n");
    paragraphs.forEach(paragraph => {
      this.ctx.font = `${fontSize}px "Embedded Space Grotesk"`;
      const lines = getLines(this.ctx, paragraph.trim(), this.canvas.width - marginLeft - marginRight);
      lines.forEach(line => {
        this.canvasObjects.push({
          type: 'text',
          font: this.ctx.font,
          fillStyle: 'white',
          content: line,
          x: marginLeft,
          y: yPos,
          opacity: 0
        });
        yPos += lineHeight;
      });
      yPos += lineHeight / 2;
    });
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

export { ProjectDescriptionPlane }