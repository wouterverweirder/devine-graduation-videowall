import { CanvasPlane } from "./CanvasPlane.js";
import { gsap, Cubic, Linear } from '../../../gsap/src/index.js';
import { getLines } from '../../../functions/getLines.js';
import QRious from '../../../qrious/qrious.js';

export class ProjectContactData {
  constructor({experience, lifeLesson, website}) {
    this.experience = experience;
    this.lifeLesson = lifeLesson;
    this.website = website;
  }
  static fromProjectData(projectData) {
    return new ProjectContactData({
      experience: projectData.attributes.experience,
      lifeLesson: projectData.attributes.lifeLesson,
      website: projectData.attributes.website
    });
  }
}

export class ProjectContactPlane extends CanvasPlane {

  canvasObjects = [];
  gradientTop = {};
  gradientTopHeight = 50;
  gradientBottom = {};
  gradientBottomHeight = 50;
  textLines = [];
  tl = false;
  textHeight = 0;
  textLinesOffset = {
    x: 0,
    y: 0
  };
  delayBeforeScrolling = 10;
  scrollSpeedFactor = 30; // smaller is slower
  bottomSectionHeight = 300;
  qrSize = 200;
  urlLines = [];

  async createInitalCanvasContent() {
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 50;

    const fontSizeTitle = 40 * 1.3333; // pt to px
    const fontSize = 36 * 1.3333; // pt to px
    const lineHeight = 70;

    const gradientTop = new OffscreenCanvas(this.props.textureSize.x, this.gradientTopHeight);
    {
      const ctx = gradientTop.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    const gradientBottom = new OffscreenCanvas(this.props.textureSize.x, this.gradientBottomHeight);
    {
      const ctx = gradientBottom.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    let yPos = fontSizeTitle + marginTop;

    const addSectionIfNeeded = (title, content) => {
      if (content) {
        // title might be too long as well
        this.ctx.font = `700 ${fontSizeTitle}px "Embedded VAGRounded"`
        const lines = getLines(this.ctx, title.trim(), this.canvas.width - marginLeft - marginRight);
        lines.forEach(line => {
          const textLine = {
            type: 'text',
            font: `700 ${fontSizeTitle}px "Embedded VAGRounded"`,
            fillStyle: 'rgb(68, 200, 245)',
            content: line,
            x: marginLeft,
            y: yPos,
            opacity: 0
          };
          this.textLines.push(textLine);
          yPos += lineHeight;
        });
    
        yPos += 50;
    
        let paragraphs = content.split("\n");
    
        paragraphs.forEach(paragraph => {
          this.ctx.font = `400 ${fontSize}px "Embedded OpenSans"`;
          const lines = getLines(this.ctx, paragraph.trim(), this.canvas.width - marginLeft - marginRight);
          lines.forEach(line => {
            const textLine = {
              type: 'text',
              font: this.ctx.font,
              fillStyle: 'black',
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

        yPos += 100;
      }
    }

    addSectionIfNeeded('WERKERVARING', this.props.data.experience);
    addSectionIfNeeded('LEVENSLES VOOR TOEKOMSTIGE STUDENTEN', this.props.data.lifeLesson);

    this.textHeight = (yPos - lineHeight / 2);
    this.textScrollAmount = Math.max(0, yPos - this.props.textureSize.y);

    // add the gradients
    this.gradientTop = {
      type: 'image',
      image: gradientTop,
      opacity: 1,
      x: 0,
      y: 0
    };
    this.gradientBottom = {
      type: 'image',
      image: gradientBottom,
      opacity: 1,
      x: 0,
      y: this.props.textureSize.y - this.bottomSectionHeight - this.gradientBottomHeight
    };

    if (this.props.data.website) {
      // create a website variable and strip http(s)://(www.) with a regex
      const website = this.props.data.website.replace(/(https?:\/\/)?(www\.)?/g, '');

      // add the qr code
      const qr = new QRious();
      qr.set({
        background: 'white',
        backgroundAlpha: 1,
        foreground: 'black',
        foregroundAlpha: 1,
        level: 'L',
        padding: 0,
        size: this.qrSize,
        value: this.props.data.website
      });
      this.qr = {
        type: 'image',
        image: qr.image,
        opacity: 1,
        x: marginLeft,
        y: this.props.textureSize.y - this.bottomSectionHeight + (this.bottomSectionHeight - this.qrSize) / 2
      }

      // add the url
      this.ctx.font = `700 ${fontSize}px "Embedded OpenSans"`;
      const urlLines = getLines(this.ctx, website, this.canvas.width - marginLeft - marginRight - this.qrSize - 50);
      urlLines.forEach((line, index) => {
        const textLine = {
          type: 'text',
          font: `700 ${fontSize}px "Embedded OpenSans"`,
          fillStyle: 'black',
          content: line,
          x: marginLeft + this.qrSize + 50,
          y: this.qr.y + lineHeight / 2 + index * lineHeight,
          opacity: 1
        };
        this.urlLines.push(textLine);
      });
    }
  }

  draw() {
    // draw my basic displaylist to the screen
    this.ctx.fillStyle = 'white';
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
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.props.textureSize.x, this.gradientTop.y);
    this.ctx.fillRect(0, this.props.textureSize.y - this.bottomSectionHeight, this.props.textureSize.x, this.bottomSectionHeight);
    drawCanvasObject(this.gradientTop);
    drawCanvasObject(this.gradientBottom);
    if (this.qr) {
      drawCanvasObject(this.qr);
      this.urlLines.forEach(canvasObject => {
        drawCanvasObject(canvasObject);
      });
    }
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
