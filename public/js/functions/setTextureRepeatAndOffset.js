const setTextureRepeatAndOffset = (texture, image, props) => {
  const w = props.scale.x;
  const h = props.scale.y;
  const w2 = image.width;
  const h2 = image.height;

  let fixedRepeatX = props.fixedRepeat.x;
  let fixedRepeatY = props.fixedRepeat.y;
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
  } else if (repeatY > 1) {
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