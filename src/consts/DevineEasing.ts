import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

const DevineEasing = {
  COLOR_PLANE: 'color-plane'
};

CustomEase.create(DevineEasing.COLOR_PLANE, "M0,0 C0.188,0 0.238,0.446 0.3,0.6 0.42,0.9 0.7,1 1,1");

export { DevineEasing };