import { getValueByPath } from '../../../functions/getValueByPath.js';
import { gsap } from '../../../gsap/src/index.js';
import { CanvasPlane } from "./CanvasPlane.js";

export class StudentNamePlane extends CanvasPlane {

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

    const maxTriangleHeightConfig = this.props.planeConfig.maxHeight - this.props.planeConfig.height;
    this.maxTriangleHeight = (!isNaN(maxTriangleHeightConfig)) ? maxTriangleHeightConfig : this.maxTriangleHeight;

    let yPos = fontSize + marginTop + this.maxTriangleHeight;

    let name = this.props.planeConfig.name?.template || '';
    name = name.replace(/\$\{([^\}]+)\}/g, (match, p1) => {
      const value = getValueByPath(this.props.data, p1);
      return value || '';
    });

    let tagLine = this.props.planeConfig.tagLine?.template || '';
    // replace the ${} items in the tagLine with the data from this.props.data
    tagLine = tagLine.replace(/\$\{([^\}]+)\}/g, (match, p1) => {
      const value = getValueByPath(this.props.data, p1);
      return value || '';
    });

    this.canvasObjects.push({
      type: 'text',
      font: `700 ${fontSize}px "Embedded VAGRounded"`,
      fillStyle: 'rgb(68,200,245)',
      content: name,
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
    this.tl.to(this, { introProgress: 1, duration: 0.5, delay: 0.1, ease: 'power1.out' });
  }

  dispose() {
    if (this.tl) {
      this.tl.kill();
    }
    super.dispose();
  }
}
