import { ScreenCamera } from '../classes/scene/objects/ScreenCamera.js';

export const ORIENTATION_LANDSCAPE = 'landscape';
export const ORIENTATION_PORTRAIT = 'portrait';
export const ORIENTATION_STATE_NORMAL = 'normal';
export const ORIENTATION_STATE_FLIPPED = 'flipped';

const precision = 2;
const PI_PRECISION = parseFloat((Math.PI).toFixed(precision));
const TAU_PRECISION = parseFloat((Math.PI * 2).toFixed(precision));

export const calculateScaleForScreenConfig = (screenConfig) => {
  let rotation = 0;
  if (screenConfig.camera.rotation) {
    rotation = screenConfig.camera.rotation;
  }

  const bounds = getBoundsForSize(screenConfig.camera.size);

  const x = bounds.right - bounds.left;
  const y = bounds.top - bounds.bottom;

  const orientation = getOrientationForRotation(rotation);
  const isLandscape = orientation.orientation === ORIENTATION_LANDSCAPE;
  if (isLandscape) {
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

export const toPositiveRadians = (angle) => {
  return ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}

export const getOrientationForRotation = (rotation) => {
  // make the rotation (radians) a positive number
  const positiveRotation = toPositiveRadians(rotation);
  const normalizedRotation = parseFloat((positiveRotation % TAU_PRECISION).toFixed(precision)) % TAU_PRECISION; // we need an extra remainder to handle rounding errors
  const quadrant = Math.floor(normalizedRotation / (PI_PRECISION / 2));
  const isLandscape = (quadrant % 2 === 0);
  const isFlipped = (isLandscape && quadrant === 2) || (!isLandscape && quadrant === 1);
  const orientation = isLandscape ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT;
  const state = isFlipped ? ORIENTATION_STATE_FLIPPED : ORIENTATION_STATE_NORMAL;
  return {orientation, state};
};

export const getBoundsForSize = ({width, height}) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const left = -1 * halfWidth;
  const right = 1 * halfWidth;
  const top = 1 * halfHeight;
  const bottom = -1 * halfHeight;
  return {
    left,
    right,
    top,
    bottom
  }
};

export const getSizeForBounds = ({left, right, top, bottom}) => {
  return { width: right - left, height: top - bottom };
};

export const createCamerasForConfig = async (config) => {
  const cameras = [];
  for ( let ii = 0; ii < config.screens.length; ++ ii ) {
    const screen = config.screens[ ii ];

    const bounds = getBoundsForSize(screen.camera.size);
    let rotation = 0;
    if (screen.camera.rotation) {
      rotation = screen.camera.rotation;
    }

    const camera = new ScreenCamera(screen.id, {
      name: `Screen ${ii}`,
      layers: [ii],
      position: {
        x: screen.camera.position[0],
        y: screen.camera.position[1],
        z: screen.camera.position[2]
      },
      rotation: {
        x: 0,
        y: 0,
        z: rotation
      },
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
      roles: screen.roles
    });

    await camera.init();
    
    cameras.push(camera);
  }
  return cameras;
};

export const getScreenCamerasForRoles = (screenCameras, roles) => {
  const applicableCameras = [];
  roles.forEach(role => applicableCameras.push(...getScreenCamerasForRole(screenCameras, role)));
  return Array.from(new Set(applicableCameras));
};

export const getScreenCamerasForRole = (screenCameras, role) => {
  return screenCameras.filter(screenCamera => doesScreenCameraHaveRole(screenCamera, role));
};

export const getFirstScreenCameraForRole = (screenCameras, role) => {
  const applicableCameras = getScreenCamerasForRole(screenCameras, role);
  if (applicableCameras.length > 0) {
    return applicableCameras[0];
  }
  return null;
};

export const doesScreenCameraHaveRole = (screenCamera, role) => {
  return screenCamera.props.roles.includes(role);
};

export const calculateBoundsOfAllScreenCameras = (screenCameras) => {
  let left = 0, right = 0, bottom = 0, top = 0;
  screenCameras.forEach(screenCamera => {
    if (screenCamera.props.rotation.z !== 0) {
      left = Math.min(screenCamera.object3D.position.x + screenCamera.object3D.bottom, left);
      right = Math.max(screenCamera.object3D.position.x + screenCamera.object3D.top, right);
      bottom = Math.min(screenCamera.object3D.position.y + screenCamera.object3D.left, bottom);
      top = Math.max(screenCamera.object3D.position.y + screenCamera.object3D.right, top);
    } else {
      left = Math.min(screenCamera.object3D.position.x + screenCamera.object3D.left, left);
      right = Math.max(screenCamera.object3D.position.x + screenCamera.object3D.right, right);
      bottom = Math.min(screenCamera.object3D.position.y + screenCamera.object3D.bottom, bottom);
      top = Math.max(screenCamera.object3D.position.y + screenCamera.object3D.top, top);
    }
  });
  const width = right - left;
  const height = top - bottom;
  const width_2 = width / 2;
  const height_2 = height / 2;
  const totalBounds = {
    width,
    height
  };
  totalBounds.x = left + width_2;
  totalBounds.y = bottom + height_2;
  totalBounds.left = totalBounds.x - width_2;
  totalBounds.right = totalBounds.x + width_2;
  totalBounds.bottom = totalBounds.y - height_2;
  totalBounds.top = totalBounds.y + height_2;
  return totalBounds;
}