import { gsap } from '../../../../gsap/src/index.js';

import { DevineEasing } from '../../../../consts/DevineEasing.js';

import { CanvasPlane } from "../CanvasPlane.js";
import { loadImage } from '../../../../functions/loadImage.js';

class DevineInfoPlane extends CanvasPlane {

  canvasObjects = [];
  tl = false;

  async createInitalCanvasContent() {
    const marginLeft = 100;
    const marginRight = 100;
    const marginTop = 100;
    const marginBottom = 100;

    const fontSize = 130;
    const lineHeight = 150;

    let yPos = fontSize + marginTop;

    this.bachelor = {
      type: 'text',
      font: `${fontSize}px "Embedded VAGRounded"`,
      fillStyle: 'white',
      content: 'Bachelor',
      x: marginLeft,
      y: yPos,
      opacity: 0
    };
    yPos += lineHeight;

    this.digitalDesignAnd = {
      type: 'text',
      font: `${fontSize}px "Embedded VAGRounded"`,
      fillStyle: 'white',
      content: 'Digital Design &',
      x: marginLeft,
      y: yPos,
      opacity: 0
    };
    yPos += lineHeight;

    this.development = {
      type: 'text',
      font: `${fontSize}px "Embedded VAGRounded"`,
      fillStyle: 'white',
      content: 'Development',
      x: marginLeft,
      y: yPos,
      opacity: 0
    };
    yPos += lineHeight;

    this.www = {
      type: 'text',
      font: `70px "Embedded VAGRounded"`,
      fillStyle: 'white',
      content: 'www.devine.be',
      x: marginLeft,
      y: this.props.textureSize.y - marginBottom - 34,
      opacity: 0
    };

    const logo = await loadImage('assets/kask-conservatorium-hogent-howest.png');
    this.logo = {
      type: 'image',
      image: logo,
      x: this.props.textureSize.x - logo.width - marginRight,
      y: this.props.textureSize.y - logo.height - marginBottom,
      opacity: 0
    };

    this.canvasObjects.push(this.bachelor);
    this.canvasObjects.push(this.digitalDesignAnd);
    this.canvasObjects.push(this.development);
    this.canvasObjects.push(this.logo);
    this.canvasObjects.push(this.www);
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
      } else if (canvasObject.type === 'image') {
        this.ctx.save();
        this.ctx.globalAlpha = canvasObject.opacity;
        this.ctx.drawImage(canvasObject.image, canvasObject.x, canvasObject.y);
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

    const textDuration = 1;

    this.tl.to(this.bachelor, { y: this.bachelor.y, opacity: 1, delay: 0, duration: textDuration, ease: DevineEasing.COLOR_PLANE }, 0);
    this.tl.to(this.digitalDesignAnd, { y: this.digitalDesignAnd.y, opacity: 1, delay: 0.2, duration: textDuration, ease: DevineEasing.COLOR_PLANE }, 0);
    this.tl.to(this.development, { y: this.development.y, opacity: 1, delay: 0.3, duration: textDuration, ease: DevineEasing.COLOR_PLANE }, 0);

    this.tl.to(this.logo, { y: this.logo.y, opacity: 1, delay: 0, duration: textDuration + 0.3, ease: DevineEasing.COLOR_PLANE }, 0);

    this.tl.to(this.www, { y: this.www.y, opacity: 1, delay: 0.4, duration: textDuration, ease: DevineEasing.COLOR_PLANE }, 0);

    const textOffset = 200;
    this.bachelor.y += textOffset;
    this.digitalDesignAnd.y += textOffset;
    this.development.y += textOffset;

    this.logo.y += textOffset;

    this.www.y += textOffset;

  }

  dispose() {
    if (this.tl) {
      this.tl.kill();
    }
    super.dispose();
  }
}

export { DevineInfoPlane }