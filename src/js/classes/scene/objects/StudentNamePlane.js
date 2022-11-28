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
    const planeConfig = this.props.appConfig.planes.namePlane || {};
    const marginLeft = 100;
    const marginTop = planeConfig.marginTop || 0;

    const maxTriangleHeightConfig = planeConfig.maxHeight - planeConfig.height;
    this.maxTriangleHeight = (!isNaN(maxTriangleHeightConfig)) ? maxTriangleHeightConfig : this.maxTriangleHeight;

    let yPos = marginTop + this.maxTriangleHeight;

    let name = planeConfig.name?.template || '';
    name = name.replace(/\$\{([^\}]+)\}/g, (match, p1) => {
      const value = getValueByPath(this.props.data, p1);
      return value || '';
    });

    let tagLine = planeConfig.tagLine?.template || '';
    // replace the ${} items in the tagLine with the data from this.props.data
    tagLine = tagLine.replace(/\$\{([^\}]+)\}/g, (match, p1) => {
      const value = getValueByPath(this.props.data, p1);
      return value || '';
    });

    const nameFont = planeConfig.name?.font || `700 80px "Embedded VAGRounded"`;
    const nameFillStyle = planeConfig.name?.fillStyle || 'rgb(68,200,245)';
    const nameMarginBottom = planeConfig.name?.marginBottom || 70;
    console.log(nameFont);
   
    this.canvasObjects.push({
      type: 'text',
      font: nameFont,
      fillStyle: nameFillStyle,
      content: name,
      x: marginLeft,
      y: yPos,
      opacity: 1
    });
    yPos += nameMarginBottom;

    const tagLineFont = planeConfig.tagLine?.font || `400 48 "Embedded VAGRounded"`;
    const tagLineFillStyle = planeConfig.tagLine?.fillStyle || '#000000';
    this.canvasObjects.push({
      type: 'text',
      font: tagLineFont,
      fillStyle: tagLineFillStyle,
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
