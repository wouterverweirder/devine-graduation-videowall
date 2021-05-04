import * as THREE from '../three.js/build/three.module.js';
import calculateScaleForScreen from './calculateScaleForScreen.js';
import loadImage from './loadImage.js';

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
  const planeCanvas = new OffscreenCanvas(maxSize, maxSize)
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

  if (plane.userData.type === 'project-info') {
    const canvasTexture = plane.material.map;
    const planeCanvas = canvasTexture.image;
    const planeCtx = planeCanvas.getContext('2d');
    
    planeCtx.fillStyle = 'black';
    planeCtx.fillRect(0, 0, planeCanvas.width, planeCanvas.height);
    planeCtx.fillStyle = 'white';
    planeCtx.font = '55px "Embedded Space Grotesk"';
    planeCtx.fillText('Project Info', topLeft.x, topLeft.y + 55);

    planeCtx.font = '55px "Embedded Space Grotesk"';

    const getLines = (ctx, text, maxWidth) => {
      const words = text.split(" ");
      const lines = [];
      let currentLine = words[0];
  
      for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = ctx.measureText(currentLine + " " + word).width;
          if (width < maxWidth) {
              currentLine += " " + word;
          } else {
              lines.push(currentLine);
              currentLine = word;
          }
      }
      lines.push(currentLine);
      return lines;
    }

    const paragraphs = plane.userData.data.description.split("\n");
    let yPos = topLeft.y + 55 + 200;
    paragraphs.forEach(paragraph => {
      const lines = getLines(planeCtx, paragraph.trim(), topRight.x - topLeft.x);
      lines.forEach(line => {
        planeCtx.fillText(line, topLeft.x, yPos );
        yPos += 55;
      });
      yPos += 55 / 2;
    });


    // planeCtx.fillText(plane.userData.data.description, topLeft.x, topLeft.y + 55 + 100  );
    
    // planeCtx.fillRect(0, 0, 10, 10);

    // planeCtx.fillRect(topLeft.x, topLeft.y, 100, 100);
    // planeCtx.fillRect(topRight.x - 100, y, 100, 100);
    // planeCtx.fillRect(bottomLeft.x, bottomLeft.y - 100, 100, 100);
    // planeCtx.fillRect(bottomRight.x - 100, bottomRight.y - 100, 100, 100);
    
    
    // planeCtx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}`;
    // planeCtx.fillRect(0, 0, planeCanvas.width, planeCanvas.height);
    canvasTexture.needsUpdate = true;
  }

  plane.userData.render = () => {
    
  };

  return plane;
};

export {
  createPlaneForScreen
};
  