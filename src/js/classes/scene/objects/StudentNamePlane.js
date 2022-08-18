import { CanvasPlane } from "./CanvasPlane.js";
import { gsap, Cubic, Linear } from '../../../gsap/src/index.js';

class StudentNamePlane extends CanvasPlane {

  tl = false;
  introProgress = 0;
  canvasObjects = [];
  maxTriangleHeight = 80;

  async createMaterial() {
    this.transparent = true;
    return await super.createMaterial();
  }

  async createInitalCanvasContent() {
    const marginLeft = 100;
    const marginTop = 50;

    const fontSize = 60 * 1.333;
    const lineHeight = 70;

    let yPos = fontSize + marginTop + this.maxTriangleHeight;

    let curriculum = 'Design';
    if (this.props.data.attributes.curriculum.data) {
      curriculum = this.props.data.attributes.curriculum.data.attributes.name;
    }
    const tagLine = `Alumnus ${curriculum}`;

    this.canvasObjects.push({
      type: 'text',
      font: `700 ${fontSize}px "Embedded VAGRounded"`,
      fillStyle: 'rgb(68,200,245)',
      content: `${this.props.data.attributes.firstName} ${this.props.data.attributes.lastName}`,
      x: marginLeft,
      y: yPos,
      opacity: 1
    });
    yPos += lineHeight;

    this.canvasObjects.push({
      type: 'text',
      font: `400 ${36*1.333}px "Embedded VAGRounded"`,
      fillStyle: 'black',
      content: `${tagLine}`,
      x: marginLeft,
      y: yPos,
      opacity: 1
    });

    this.draw();
  }

  draw() {
    // draw my basic displaylist to the screen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, this.maxTriangleHeight, this.canvas.width, this.canvas.height - this.maxTriangleHeight);
    // draw triangle
    const triangleHeight = this.maxTriangleHeight * this.introProgress;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.maxTriangleHeight);
    this.ctx.lineTo(this.canvas.width, this.maxTriangleHeight);
    this.ctx.lineTo(this.canvas.width, this.maxTriangleHeight - triangleHeight);
    this.ctx.closePath();
    this.ctx.fill();
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
    console.log('intro');
    this.tl.to(this, { introProgress: 1, duration: 0.5, delay: 0.1, ease: 'power1.out' });
  }

  dispose() {
    if (this.tl) {
      this.tl.kill();
    }
    super.dispose();
  }
}

export { StudentNamePlane }