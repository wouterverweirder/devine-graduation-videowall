const calculateScaleForScreen = (screen) => {
  let rotation = 0;
  if (screen.camera.rotation) {
    rotation = screen.camera.rotation;
  }
  const size = screen.camera.size;
  const halfFrustrumSize = size.width / 2;
  const aspect = size.width / size.height;

  const left = 0.5 * halfFrustrumSize * aspect / - 1;
  const right = 0.5 * halfFrustrumSize * aspect;
  const top = halfFrustrumSize / 2;
  const bottom = halfFrustrumSize / - 2;

  const x = right - left;
  const y = top - bottom;

  // dirty fix, just assume 90 degrees when non-zero
  if (rotation === 0) {
    return {
      x,
      y
    }
  }
  return {
    x: y,
    y: x
  }
};

export default calculateScaleForScreen;