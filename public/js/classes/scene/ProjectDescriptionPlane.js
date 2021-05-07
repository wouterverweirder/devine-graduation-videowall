import * as THREE from '../../three.js/build/three.module.js';
import { VisualBase } from "./VisualBase.js";
import { gsap } from '../../gsap/src/index.js';
import { getLines } from '../../functions/getLines.js';

class ProjectDescriptionPlane extends VisualBase {
  async createMaterial() {

    const canvas = new OffscreenCanvas(this.props.textureSize.x, this.props.textureSize.y);
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);

    this.canvas = canvas;
    this.ctx = ctx;
    this.texture = texture;

    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 50;

    const fontSize = 55;
    const lineHeight = 70;

    let yPos = fontSize + marginTop;

    const canvasObjects = [
      {
        type: 'text',
        font: `${fontSize}px "Embedded Space Grotesk"`,
        fillStyle: 'white',
        content: 'Project Info',
        x: marginLeft,
        y: yPos
      }
    ];

    yPos += 200;
    const paragraphs = this.props.data.description.split("\n");
    paragraphs.forEach(paragraph => {
      this.ctx.font = `${fontSize}px "Embedded Space Grotesk"`;
      const lines = getLines(this.ctx, paragraph.trim(), this.canvas.width - marginLeft - marginRight);
      lines.forEach(line => {
        canvasObjects.push({
          type: 'text',
          font: this.ctx.font,
          fillStyle: 'white',
          content: line,
          x: marginLeft,
          y: yPos
        })
        yPos += lineHeight;
      });
      yPos += lineHeight / 2;
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
      y: this.canvas.height + 100,
      stagger: {
        amount: 0.5,
        ease: "cubic.inOut"
      },
      onUpdate: () => {
        draw();
      }
    });

    return new THREE.MeshBasicMaterial( { map: texture } );
  }

  dispose() {
    this.texture.dispose();
    super.dispose();
  }
}

export { ProjectDescriptionPlane }