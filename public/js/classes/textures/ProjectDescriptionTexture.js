import { ScreenTexture } from "./ScreenTexture.js";
import { gsap } from '../../gsap/src/index.js';
import { getLines } from '../../functions/getLines.js';

class ProjectDescriptionTexture extends ScreenTexture {

  async init() {

    const marginLeft = 100;
    const marginRight = 100;
    const marginTop = 100;

    let yPos = this.topLeft.y + 55 + marginTop;

    const canvasObjects = [
      {
        type: 'text',
        font: '55px "Embedded Space Grotesk"',
        fillStyle: 'white',
        content: 'Project Info',
        x: this.topLeft.x + marginLeft,
        y: yPos
      }
    ];

    yPos += 200;
    const paragraphs = this.userData.data.description.split("\n");
    paragraphs.forEach(paragraph => {
      this.ctx.font = '55px "Embedded Space Grotesk"';
      const lines = getLines(this.ctx, paragraph.trim(), this.topRight.x - this.topLeft.x - marginLeft - marginRight);
      lines.forEach(line => {
        canvasObjects.push({
          type: 'text',
          font: this.ctx.font,
          fillStyle: 'white',
          content: line,
          x: this.topLeft.x + marginLeft,
          y: yPos
        })
        yPos += 55;
      });
      yPos += 55 / 2;
    });

    // draw my basic displaylist to the screen
    const draw = () => {
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      canvasObjects.forEach(canvasObject => {
        if (canvasObject.type === 'text') {
          this.ctx.fillStyle = canvasObject.fillStyle;
          this.ctx.font = canvasObject.font;
          this.ctx.fillText(canvasObject.content, canvasObject.x, canvasObject.y );
        }
      });
      this.texture.needsUpdate = true;
    };

    gsap.from(canvasObjects, {
      y: this.bottomRight.y + 100,
      stagger: {
        amount: 0.5,
        ease: "cubic.inOut"
      },
      onUpdate: () => {
        draw();
      }
    });

    draw();
  }
}

export { ProjectDescriptionTexture };