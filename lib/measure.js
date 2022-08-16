const config = require('../public/config.json');

const cameras = config.screens.map(screen => screen.camera);
let left = 0, right = 0, bottom = 0, top = 0;
cameras.forEach(camera => {
  if (camera.rotation.z !== 0) {
    left = Math.min(camera.position[0] - camera.size.height/2, left);
    right = Math.max(camera.position[0] + camera.size.height/2, right);
    bottom = Math.min(camera.position[1] - camera.size.width/2, bottom);
    top = Math.max(camera.position[1] + camera.size.width/2, top);
  } else {
    left = Math.min(camera.position[0] - camera.size.width/2, left);
    right = Math.max(camera.position[0] + camera.size.width/2, right);
    bottom = Math.min(camera.position[1] - camera.size.height/2, bottom);
    top = Math.max(camera.position[1] + camera.size.height/2, top);
  }
});
const width = right - left;
const height = top - bottom;

console.log(width, height);