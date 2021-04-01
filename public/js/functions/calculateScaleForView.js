const calculateScaleForView = (view) => {
  let rotation = 0;
  if (view.config.camera.rotation) {
    rotation = view.config.camera.rotation;
  }
  const size = view.config.camera.size;
  const halfFrustrumSize = size.width / 2;
  const aspect = size.width / size.height;
  // dirty fix, just assume 90 degrees when non-zero
  if (rotation === 0) {
    return {
      x: halfFrustrumSize * aspect,
      y: halfFrustrumSize
    }
  }
  return {
    y: halfFrustrumSize * aspect,
    x: halfFrustrumSize
  }
};

export default calculateScaleForView;