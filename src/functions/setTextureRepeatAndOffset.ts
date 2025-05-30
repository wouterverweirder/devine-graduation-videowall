import * as THREE from 'three';

type ImageType = HTMLImageElement | HTMLVideoElement | ImageBitmap | HTMLCanvasElement | OffscreenCanvas;
type Props = {
  scale: { x: number; y: number };
  fixedRepeat?: { x: number; y: number };
  anchor: { x: number; y: number };
}

const setTextureRepeatAndOffset = (texture:THREE.Texture, image:ImageType, props:Props) => {
  const w = props.scale.x;
  const h = props.scale.y;
  const w2 = ('videoWidth' in image) ? image.videoWidth : image.width;
  const h2 = ('videoHeight' in image) ? image.videoHeight : image.height;

  const fixedRepeatX = props.fixedRepeat.x;
  const fixedRepeatY = props.fixedRepeat.y;
  let repeatX, repeatY;
  let setRepeatXFromRepeatY = false;
  let setRepeatYFromRepeatX = false;

  repeatX = w * h2 / (h * w2);
  setRepeatXFromRepeatY = false;
  setRepeatYFromRepeatX = true;
  if (repeatX > 1) {
    repeatX = 1;
    setRepeatXFromRepeatY = false;
    setRepeatYFromRepeatX = true;
  } else if (repeatY && repeatY > 1) {
    repeatY = 1;
    setRepeatXFromRepeatY = true;
    setRepeatYFromRepeatX = false;
  }
  if (fixedRepeatX) {
    repeatX = fixedRepeatX;
    setRepeatXFromRepeatY = false;
    setRepeatYFromRepeatX = true;
  }
  if (fixedRepeatY) {
    repeatY = fixedRepeatY;
    setRepeatXFromRepeatY = true;
    setRepeatYFromRepeatX = false;
  }

  if (setRepeatYFromRepeatX) {
    repeatY = repeatX * h * w2 / (w * h2);
  }
  if (setRepeatXFromRepeatY) {
    repeatX = repeatY * w * h2 / (h * w2);
  }
  
  texture.repeat.set(repeatX, repeatY);
  texture.offset.x = (repeatX - 1) * props.anchor.x * -1;
  texture.offset.y = (repeatY - 1) * (1 - props.anchor.y) * -1;
};

export { setTextureRepeatAndOffset };