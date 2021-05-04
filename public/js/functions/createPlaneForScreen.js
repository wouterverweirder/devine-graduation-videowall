import * as THREE from '../three.js/build/three.module.js';
import { gsap } from '../gsap/src/index.js';
import calculateScaleForScreen from './calculateScaleForScreen.js';
import { loadImage } from './loadImage.js';
import { getLines } from './getLines.js'

const createTextureForPlane = async (userData, screenConfig, appConfig) => {
  const width = Math.floor( appConfig.appDimensions.width * screenConfig.output.width );
  const height = Math.floor( appConfig.appDimensions.height * screenConfig.output.height );
  const maxSize = Math.max(width, height);
  
  if (userData.type === 'video') {
    return new THREE.VideoTexture(video);
  }
  if (userData.type === 'image') {
    const planeCanvas = new OffscreenCanvas(maxSize, maxSize);
    const planeCtx = planeCanvas.getContext('2d');

    // draw the image in the center of the plane
    const image = await loadImage(userData.url);
    const offsetX = (maxSize - image.width) / 2;
    const offsetY = (maxSize - image.height) / 2;
    planeCtx.drawImage(image, offsetX, offsetY);

    return new THREE.CanvasTexture(planeCanvas);
  }
  // default: an empty canvas
  const planeCanvas = new OffscreenCanvas(maxSize, maxSize);
  return new THREE.CanvasTexture(planeCanvas);
};

const createPlaneForScreen = async ({userData, screenConfig, appConfig}) => {

  const texture = await createTextureForPlane(userData, screenConfig, appConfig);
  const material = new THREE.MeshBasicMaterial( { map: texture } );
  const planeGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  const plane = new THREE.Mesh(planeGeometry, material);

  plane.name = `${userData.type} plane ${screenConfig.id}`;

  // place it on a certain config.screens camera
  plane.position.x = screenConfig.camera.position[0];
  plane.position.y = screenConfig.camera.position[1];

  const scale = calculateScaleForScreen(screenConfig);
  plane.scale.set(scale.x, scale.y);

  // clip to center
  const textureAspectRatio = scale.x / scale.y;
  const isPortrait = textureAspectRatio < 1;
  let repeatX = 1;
  let repeatY = 1 / textureAspectRatio;
  if (isPortrait) {
    repeatX = textureAspectRatio;
    repeatY = 1;
  }
  texture.repeat.set(repeatX, repeatY);
  texture.offset.x = (repeatX - 1) * -0.5;
  texture.offset.y = (repeatY - 1) * -0.5;

  Object.assign(plane.userData, userData);
  
  const w = 1920;
  const h = 1080;
  const x = isPortrait ? (w - h) / 2 : 0;
  const y = isPortrait ? 0 : (w - h) / 2;

  const topLeft = {x, y};
  const topRight = {x: w - x, y};
  const bottomLeft = {x, y: (isPortrait) ? w : y + h};
  const bottomRight = {x: w - x, y: (isPortrait) ? w : y + h};

  if (plane.userData.type === 'project-description') {
    const canvasTexture = plane.material.map;
    const planeCanvas = canvasTexture.image;
    const planeCtx = planeCanvas.getContext('2d');
    
    const marginLeft = 100;
    const marginRight = 100;
    const marginTop = 100;

    let yPos = topLeft.y + 55 + marginTop;

    const canvasObjects = [
      {
        type: 'text',
        font: '55px "Embedded Space Grotesk"',
        fillStyle: 'white',
        content: 'Project Info',
        x: topLeft.x + marginLeft,
        y: yPos
      }
    ];

    yPos += 200;
    const paragraphs = plane.userData.data.description.split("\n");
    paragraphs.forEach(paragraph => {
      planeCtx.font = '55px "Embedded Space Grotesk"';
      const lines = getLines(planeCtx, paragraph.trim(), topRight.x - topLeft.x - marginLeft - marginRight);
      lines.forEach(line => {
        canvasObjects.push({
          type: 'text',
          font: planeCtx.font,
          fillStyle: 'white',
          content: line,
          x: topLeft.x + marginLeft,
          y: yPos
        })
        yPos += 55;
      });
      yPos += 55 / 2;
    });

    gsap.from(canvasObjects, {
      y: bottomRight.y + 100,
      stagger: {
        amount: 0.5,
        ease: "cubic.inOut"
      }
    });

    plane.userData.render = () => {
      planeCtx.fillStyle = 'black';
      planeCtx.fillRect(0, 0, planeCanvas.width, planeCanvas.height);
      canvasObjects.forEach(canvasObject => {
        if (canvasObject.type === 'text') {
          planeCtx.fillStyle = canvasObject.fillStyle;
          planeCtx.font = canvasObject.font;
          planeCtx.fillText(canvasObject.content, canvasObject.x, canvasObject.y );
        }
      });
      canvasTexture.needsUpdate = true;
    };

    canvasTexture.needsUpdate = true;
  }

  if (!plane.userData.render) {
    plane.userData.render = () => {
    };
  }

  return plane;
};

export {
  createPlaneForScreen
};
  