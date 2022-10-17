import { CanvasPlane } from "./CanvasPlane.js";
import { gsap, Cubic, Linear } from '../../../gsap/src/index.js';
import { getLines } from '../../../functions/getLines.js';
import { loadImage } from "../../../functions/loadImage.js";

export class ProjectQuoteData {
  constructor({quote, backgroundColor}) {
    this.quote = quote;
    this.backgroundColor = backgroundColor;
  }
  static fromProjectData(projectData) {
    return new ProjectQuoteData({
      quote: projectData.attributes.quote,
      backgroundColor: projectData.attributes.curriculum.data?.attributes.pillar.data?.attributes.color
    });
  }
}

export class ProjectQuotePlane extends CanvasPlane {

  canvasObjects = [];
  textLines = [];
  tl = false;
  textHeight = 0;
  textLinesOffset = {
    x: 0,
    y: 0
  };
  backgroundColor = 'black';

  async createInitalCanvasContent() {
    if (this.props.data.backgroundColor) {
      this.backgroundColor = `#${this.props.data.backgroundColor}`;
    }
    this.quoteImage = await loadImage('assets/quote.svg');
    const marginLeft = 100;
    const marginRight = 100;
    const marginTop = 0;

    const fontSize = 70 * 1.333; //pt to px
    const lineHeight = 80 * 1.333;

    let yPos = fontSize + marginTop;

    const paragraphs = this.props.data.quote.split("\n");

    const textStartY = yPos;

    this.canvasObjects.push({
      type: 'image',
      image: this.quoteImage,
      x: 112,
      y: 90,
      width: 267,
      height: 420,
      opacity: 0.67
    });
    this.canvasObjects.push({
      type: 'image',
      image: this.quoteImage,
      x: 424,
      y: 90,
      width: 267,
      height: 420,
      opacity: 0.67
    });

    paragraphs.forEach(paragraph => {
      this.ctx.font = `300 ${fontSize}px "Embedded VAGRounded"`;
      const lines = getLines(this.ctx, paragraph.trim(), this.canvas.width - marginLeft - marginRight);
      lines.forEach(line => {
        const textWidth = this.ctx.measureText(line).width;
        const textLine = {
          type: 'text',
          font: this.ctx.font,
          fillStyle: 'black',
          content: line,
          x: (this.canvas.width - textWidth) / 2,
          y: yPos,
          opacity: 0
        };
        this.textLines.push(textLine);
        yPos += lineHeight;
      });
      yPos += lineHeight / 2;
    });

    this.textHeight = (yPos - textStartY - lineHeight / 2);
    // vertical center
    this.textLinesOffset.y = (this.canvas.height - this.textHeight) / 2;
  }

  draw() {
    // draw my basic displaylist to the screen
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const drawCanvasObject = canvasObject => {
      if (canvasObject.type === 'text') {
        this.ctx.save();
        this.ctx.globalAlpha = canvasObject.opacity;
        this.ctx.fillStyle = canvasObject.fillStyle;
        this.ctx.font = canvasObject.font;
        this.ctx.fillText(canvasObject.content, canvasObject.x, canvasObject.y );
        this.ctx.restore();
      } else if (canvasObject.type === 'image') {
        this.ctx.save();
        this.ctx.globalAlpha = canvasObject.opacity;
        this.ctx.drawImage(canvasObject.image, canvasObject.x, canvasObject.y, canvasObject.width, canvasObject.height);
        this.ctx.restore();
      }
    };

    this.canvasObjects.forEach(canvasObject => {
      drawCanvasObject(canvasObject);
    });
    this.ctx.save();
    this.ctx.translate(this.textLinesOffset.x, this.textLinesOffset.y);
    this.textLines.forEach(canvasObject => {
      drawCanvasObject(canvasObject);
    });
    this.ctx.restore();
    this.texture.needsUpdate = true;
  }

  intro() {
    // setup timeline
    this.tl = gsap.timeline({
      repeat: (this.textScrollAmount > 0) ? -1 : 0,
      onUpdate: () => {
        this.draw();
      }
    });
    const maxDelay = 0.5;
    const delayOffset = 0.1;
    this.textLines.forEach((canvasObject, index) => {
      const delay = delayOffset + Cubic.easeInOut(index / this.textLines.length) * maxDelay;
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
