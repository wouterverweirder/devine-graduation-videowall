import { CanvasPlane } from "./CanvasPlane.js";
import { gsap, Cubic, Linear } from '../../../gsap/src/index.js';
import { getValueByPath } from '../../../functions/getValueByPath.js';
import { getLines } from '../../../functions/getLines.js';

export class ProjectTextPlane extends CanvasPlane {

  canvasObjects = [];
  title = {};
  gradientTop = {};
  gradientBottom = {};
  textLines = [];
  tl = false;
  textHeight = 0;
  textLinesOffset = {
    x: 0,
    y: 0
  };
  delayBeforeScrolling = 10;
  scrollSpeedFactor = 30; // smaller is slower

  async createInitalCanvasContent() {

    const planeConfig = this.props.planeConfig || {};

    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = planeConfig.marginTop || 50;

    const gradientTop = new OffscreenCanvas(this.props.textureSize.x, (planeConfig.gradientTop?.height || 50));
    {
      const ctx = gradientTop.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      if (planeConfig.gradientTop?.stops) {
        for (const stopKey in planeConfig.gradientTop.stops) {
          if (Object.hasOwnProperty.call(planeConfig.gradientTop, stopKey)) {
            const stop = planeConfig.gradientTop[stopKey];
            gradient.addColorStop(parseInt(stopKey), stop);
          }
        }
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    const gradientBottom = new OffscreenCanvas(this.props.textureSize.x, (planeConfig.gradientBottom?.height || 50));
    {
      const ctx = gradientBottom.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      if (planeConfig.gradientBottom?.stops) {
        for (const stopKey in planeConfig.gradientBottom.stops) {
          if (Object.hasOwnProperty.call(planeConfig.gradientBottom.stops, stopKey)) {
            const stop = planeConfig.gradientBottom.stops[stopKey];
            gradient.addColorStop(parseInt(stopKey), stop);
          }
        }
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    let yPos = marginTop;

    let title = planeConfig.title?.template || 'Project Description';
    title = title.replace(/\$\{([^\}]+)\}/g, (match, p1) => {
      const value = getValueByPath(this.props.data, p1);
      return value || '';
    });

    this.title = {
      type: 'text',
      font: planeConfig.title?.font || `700 53px "Embedded VAGRounded"`,
      fillStyle: planeConfig.title?.fillStyle || 'rgb(68, 200, 245)',
      content: title,
      x: marginLeft,
      y: yPos,
      opacity: 0
    };

    yPos += planeConfig.title?.marginBottom || 100;

    let content = planeConfig.paragraphs?.template || '';
    content = content.replace(/\$\{([^\}]+)\}/g, (match, p1) => {
      const value = getValueByPath(this.props.data, p1);
      return value || '';
    });

    const paragraphs = content.split("\n");

    const textStartY = yPos;

    const lineHeight = planeConfig.paragraphs?.lineHeight || 70;
    paragraphs.forEach(paragraph => {
      this.ctx.font = planeConfig.paragraphs?.font || `400 53px "Embedded OpenSans"`;
      const lines = getLines(this.ctx, paragraph.trim(), this.canvas.width - marginLeft - marginRight);
      lines.forEach(line => {
        const textLine = {
          type: 'text',
          font: planeConfig.paragraphs?.font || `400 53px "Embedded OpenSans"`,
          fillStyle: planeConfig.paragraphs?.fillStyle || `#000000`,
          content: line,
          x: marginLeft,
          y: yPos,
          opacity: 0
        };
        this.textLines.push(textLine);
        yPos += lineHeight;
      });
      yPos += lineHeight / 2;
    });

    this.textHeight = (yPos - textStartY - lineHeight / 2);
    this.textScrollAmount = Math.max(0, yPos - this.props.textureSize.y);

    // add the gradients
    this.gradientTop = {
      type: 'image',
      image: gradientTop,
      opacity: 1,
      x: 0,
      y: planeConfig.gradientTop?.y || 100
    };
    this.gradientBottom = {
      type: 'image',
      image: gradientBottom,
      opacity: 1,
      x: 0,
      y: this.props.textureSize.y - (planeConfig.gradientBottom.height || 50)
    };
    console.log(this.gradientBottom);
  }

  draw() {
    // draw my basic displaylist to the screen
    const planeConfig = this.props.planeConfig || {};
    this.ctx.fillStyle = planeConfig.backgroundColor || 'white';
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
        this.ctx.drawImage(canvasObject.image, canvasObject.x, canvasObject.y);
        this.ctx.restore();
      }
    };

    this.ctx.save();
    this.ctx.translate(this.textLinesOffset.x, this.textLinesOffset.y);
    this.textLines.forEach(canvasObject => {
      drawCanvasObject(canvasObject);
    });
    this.ctx.restore();
    this.ctx.fillStyle = planeConfig.backgroundColor || 'white';
    this.ctx.fillRect(0, 0, this.props.textureSize.x, this.gradientTop.y);
    drawCanvasObject(this.gradientTop);
    drawCanvasObject(this.gradientBottom);
    drawCanvasObject(this.title);
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
    this.title.opacity = 1;
    // this.tl.to(this.title, { y: this.title.y, opacity: 1, duration: 0.5, ease: Cubic.easeInOut }, 0);
    // this.title.y += 100;
    this.textLines.forEach((canvasObject, index) => {
      const delay = delayOffset + Cubic.easeInOut(index / this.textLines.length) * maxDelay;
      this.tl.to(canvasObject, { y: canvasObject.y, opacity: 1, delay, duration: 0.5, ease: Cubic.easeInOut }, 0);
      canvasObject.y = canvasObject.y + 100;
    });

    if (this.textScrollAmount > 0) {
      const totalScrollAmount = this.textScrollAmount + this.props.textureSize.y / 2;
      this.tl.to(this.textLinesOffset, {y: -totalScrollAmount, duration: totalScrollAmount / this.scrollSpeedFactor, ease: Linear.easeNone, delay: this.delayBeforeScrolling });
      const scrollEndTime = this.tl.duration();
      this.tl.to(this.textLines, { opacity: 0, duration: 2 }, scrollEndTime - 2);
    }

  }

  dispose() {
    if (this.tl) {
      this.tl.kill();
    }
    super.dispose();
  }
}