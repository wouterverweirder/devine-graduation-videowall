import { getBoundsForSize } from "./createCamerasForConfig.js";

const calculateScaleForScreen = (screen) => {
  let rotation = 0;
  if (screen.camera.rotation) {
    rotation = screen.camera.rotation;
  }

  const bounds = getBoundsForSize(screen.camera.size);

  const x = bounds.right - bounds.left;
  const y = bounds.top - bounds.bottom;

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