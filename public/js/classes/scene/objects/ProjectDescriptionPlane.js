import { CanvasPlane } from "./CanvasPlane.js";
import { gsap, Cubic, Linear } from '../../../gsap/src/index.js';
import { getLines } from '../../../functions/getLines.js';

class ProjectDescriptionPlane extends CanvasPlane {

  canvasObjects = [];
  title = {};
  gradientTop = {};
  gradientTopHeight = 100;
  gradientBottom = {};
  gradientBottomHeight = 100;
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
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 50;

    const fontSize = 55;
    const lineHeight = 70;

    const gradientTop = new OffscreenCanvas(this.props.textureSize.x, this.gradientTopHeight);
    {
      const ctx = gradientTop.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    const gradientBottom = new OffscreenCanvas(this.props.textureSize.x, this.gradientBottomHeight);
    {
      const ctx = gradientBottom.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    let yPos = fontSize + marginTop;

    this.title = {
      type: 'text',
      font: `${fontSize}px "Embedded Space Grotesk"`,
      fillStyle: 'white',
      content: 'Project Info',
      x: marginLeft,
      y: yPos,
      opacity: 0
    };

    yPos += 200;

    const paragraphs = this.props.data.description.split("\n");

    const textStartY = yPos;

    paragraphs.forEach(paragraph => {
      this.ctx.font = `${fontSize}px "Embedded Space Grotesk"`;
      const lines = getLines(this.ctx, paragraph.trim(), this.canvas.width - marginLeft - marginRight);
      lines.forEach(line => {
        const textLine = {
          type: 'text',
          font: this.ctx.font,
          fillStyle: 'white',
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
      y: 150
    };
    this.gradientBottom = {
      type: 'image',
      image: gradientBottom,
      opacity: 1,
      x: 0,
      y: this.props.textureSize.y - this.gradientBottomHeight
    };
  }

  draw() {
    // draw my basic displaylist to the screen
    this.ctx.fillStyle = 'black';
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
    this.ctx.fillStyle = 'black';
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
    this.tl.to(this.title, { y: this.title.y, opacity: 1, duration: 0.5, ease: Cubic.easeInOut }, 0);
    this.title.y += 100;
    this.textLines.forEach((canvasObject, index) => {
      const delay = delayOffset + Cubic.easeInOut(index / this.textLines.length) * maxDelay;
      this.tl.to(canvasObject, { y: canvasObject.y, opacity: 1, delay, duration: 0.5, ease: Cubic.easeInOut }, 0);
      canvasObject.y = canvasObject.y + 100;
    });

    if (this.textScrollAmount > 0) {
      const totalScrollAmount = this.textScrollAmount + this.textureSize.y / 2;
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

export { ProjectDescriptionPlane }