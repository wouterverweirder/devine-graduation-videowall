import { gsap } from '../../../gsap/src/index.js';
import { CanvasPlane } from "./CanvasPlane.js";
import { getValueByPath } from '../../../functions/getValueByPath.js';
import { loadImage } from "../../../functions/loadImage.js";

// shows a photo and name
export class ProfilePicturePlane extends CanvasPlane {

  tl = false;
  nameOffsetY = 0;
  triangleProgress = 0;
  canvasObjects = [];
  maxTriangleHeight = 80;

  async createMaterial() {
    this.planeConfig = this.props.appConfig.planes.namePlane || {};
    this.transparent = true;
    return await super.createMaterial();
  }

  async createInitalCanvasContent() {
    const marginLeft = 100;
    const marginTop = this.planeConfig.marginTop || 0;

    const maxTriangleHeightConfig = this.planeConfig.maxHeight - this.planeConfig.height;
    this.maxTriangleHeight = (!isNaN(maxTriangleHeightConfig)) ? maxTriangleHeightConfig : this.maxTriangleHeight;

    this.nameOffsetY = this.planeConfig.height;

    let yPos = marginTop + this.maxTriangleHeight;

    let name = this.planeConfig.name?.template || '';
    name = name.replace(/\$\{([^\}]+)\}/g, (match, p1) => {
      const value = getValueByPath(this.props.data, p1);
      return value || '';
    });

    let tagLine = this.planeConfig.tagLine?.template || '';
    // replace the ${} items in the tagLine with the data from this.props.data
    tagLine = tagLine.replace(/\$\{([^\}]+)\}/g, (match, p1) => {
      const value = getValueByPath(this.props.data, p1);
      return value || '';
    });

    // image
    const image = await loadImage(this.props.data.profilePicture.data?.attributes.url);
    // Define the target area dimensions
    const targetWidth = this.props.textureSize.x;
    const targetHeight = this.props.textureSize.y;

    // Define the original image dimensions
    const originalWidth = image.width;
    const originalHeight = image.height;

    // calculate the crop area to fit the image in the target area, keeping the image proportions
    const targetRatio = targetWidth / targetHeight;
    const originalRatio = originalWidth / originalHeight;
    let sourceWidth = originalWidth;
    let sourceHeight = originalHeight;
    let sourceX = 0;
    let sourceY = 0;
    if (originalRatio > targetRatio) {
      sourceWidth = originalHeight * targetRatio;
      sourceX = (originalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = originalWidth / targetRatio;
      sourceY = (originalHeight - sourceHeight) / 2;
    }
    


    this.canvasObjects.push({
      type: 'image',
      image,
      x: 0,
      y: 0,
      width: targetWidth,
      height: targetHeight,
      sourceX: sourceX,
      sourceY: sourceY,
      sourceWidth: sourceWidth,
      sourceHeight: sourceHeight,
    });

    // name background
    this.canvasObjects.push({
      type: 'name-background'
    });

    const nameFont = this.planeConfig.name?.font || `700 80px "Embedded VAGRounded"`;
    const nameFillStyle = this.planeConfig.name?.fillStyle || 'rgb(68,200,245)';
    const nameMarginBottom = this.planeConfig.name?.marginBottom || 70;
   
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

    const tagLineFont = this.planeConfig.tagLine?.font || `400 48 "Embedded VAGRounded"`;
    const tagLineFillStyle = this.planeConfig.tagLine?.fillStyle || '#000000';
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
    this.canvasObjects.forEach(canvasObject => {
      if (canvasObject.type === 'text') {
        this.ctx.save();
        this.ctx.translate(0, this.canvas.height - this.planeConfig.maxHeight + this.nameOffsetY);
        this.ctx.globalAlpha = canvasObject.opacity;
        this.ctx.fillStyle = canvasObject.fillStyle;
        this.ctx.font = canvasObject.font;
        this.ctx.fillText(canvasObject.content, canvasObject.x, canvasObject.y );
        this.ctx.restore();
      } else if (canvasObject.type === 'image') {
        this.ctx.save();
        this.ctx.globalAlpha = canvasObject.opacity;
        this.ctx.drawImage(
          canvasObject.image,
          canvasObject.sourceX,
          canvasObject.sourceY,
          canvasObject.sourceWidth,
          canvasObject.sourceHeight,
          canvasObject.x,
          canvasObject.y,
          canvasObject.width,
          canvasObject.height,
        );
        this.ctx.restore();
      } else if (canvasObject.type === 'name-background') {
        this.ctx.save();
        this.ctx.translate(0, this.canvas.height - this.planeConfig.maxHeight + this.nameOffsetY);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, this.maxTriangleHeight, this.canvas.width, this.planeConfig.height);
        // draw triangle
        const triangleHeight = this.maxTriangleHeight * this.triangleProgress;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.maxTriangleHeight);
        this.ctx.lineTo(this.canvas.width, this.maxTriangleHeight);
        this.ctx.lineTo(this.canvas.width, this.maxTriangleHeight - triangleHeight);
        this.ctx.closePath();
        this.ctx.fill();
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
    this.tl.to(this, { nameOffsetY: 0, duration: 0.5, ease: 'power2.out' });
    this.tl.to(this, { triangleProgress: 1, duration: 0.5, ease: 'power1.out' }, "<= 0.2");
  }

  dispose() {
    if (this.tl) {
      this.tl.kill();
    }
    super.dispose();
  }
}
