import { CanvasPlane } from "./CanvasPlane.js";

class StudentNamePlane extends CanvasPlane {

  canvasObjects = [];

  async createInitalCanvasContent() {
    const marginLeft = 100;
    const marginTop = 50;

    const fontSize = 70;
    const lineHeight = 70;

    let yPos = fontSize + marginTop;

    const tagLine = `Expert Design`;

    this.canvasObjects.push({
      type: 'text',
      font: `${fontSize}px "Embedded Space Grotesk"`,
      fillStyle: 'black',
      content: `${this.props.data.firstName} ${this.props.data.lastName}`,
      x: marginLeft,
      y: yPos,
      opacity: 1
    });
    yPos += lineHeight;

    this.canvasObjects.push({
      type: 'text',
      font: `50px "Embedded Space Grotesk"`,
      fillStyle: '#797979',
      content: `${tagLine}`,
      x: marginLeft,
      y: yPos,
      opacity: 1
    });

    this.draw();
  }

  draw() {
    // draw my basic displaylist to the screen
    this.ctx.fillStyle = 'white';
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
}

export { StudentNamePlane }