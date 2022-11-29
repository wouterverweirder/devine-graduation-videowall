import { DevineEasing } from '../../consts/DevineEasing.js';
import { gsap } from '../../gsap/src/index.js';

class PlaneSlider {

  scene = null;
  animationTimeoutId = false;
  nonVisiblePlanes = [];
  visiblePlanes = [];
  pickingMethod = 'next'; // or 'random'

  setupNewPlane = ({ oldPlane, newPlane }) => {};
  getAxis = ({ oldPlane, newPlane }) => 'horizontal';
  getDirection = ({ oldPlane, newPlane }) => -1;
  getSlideDuration = () => 1;
  getSlideDelay = () => 0;
  getDelayForNextAnimation = () => 1;

  constructor(scene, {
    objectConfig = {},
    nonVisiblePlanes = [],
    visiblePlanes = [],
    setupNewPlane = ({ oldPlane, newPlane }) => {},
    getAxis = ({ oldPlane, newPlane }) => 'horizontal',
    getDirection = ({ oldPlane, newPlane }) => -1,
    getSlideDuration = () => 1,
    getSlideDelay = () => 0,
    getDelayForNextAnimation = () => 1,
    pickingMethod = 'next'
  } = {}) {
    this.scene = scene;
    this.objectConfig = objectConfig;
    this.nonVisiblePlanes = nonVisiblePlanes;
    this.visiblePlanes = visiblePlanes;
    this.setupNewPlane = setupNewPlane;
    this.getAxis = getAxis;
    this.getDirection = getDirection;
    this.getSlideDuration = getSlideDuration;
    this.getSlideDelay = getSlideDelay;
    this.getDelayForNextAnimation = getDelayForNextAnimation;
    this.pickingMethod = pickingMethod;

  }

  stop(){
    this.killAnimationTimeout();
  }

  start() {
    this.scheduleAnimationTimeout();
  }

  killAnimationTimeout() {
    clearTimeout(this.animationTimeoutId);
  }

  scheduleAnimationTimeout() {
    this.killAnimationTimeout();
    const delayForNextAnimation = this.getDelayForNextAnimation();
    this.animationTimeoutId = setTimeout(() => {
      this.animationTimeoutCb();
      this.scheduleAnimationTimeout();
    }, delayForNextAnimation);
  }

  getNewPlane({ oldPlane } = {}) {
    const newPlane = this.nonVisiblePlanes.shift();
    if (!newPlane) {
      return null;
    }
    if (oldPlane) {
      newPlane.customData.camera = oldPlane.customData.camera;
    }
    return newPlane;
  }

  getOldPlane() {
    if (this.pickingMethod === 'next') {
      return this.visiblePlanes[0];
    }
    // random
    const index = Math.floor(Math.random() * this.visiblePlanes.length);
    if (index >= this.visiblePlanes.length) {
      return;
    }
    return this.visiblePlanes[index];
  }

  addObject(o) {
    this.scene.addObject(o);
    this.visiblePlanes.push(o);
  }

  removeObject(o) {
    const indexToRemove = this.visiblePlanes.indexOf(o);
    if (indexToRemove >= this.visiblePlanes.length) {
      return;
    }
    this.visiblePlanes.splice(indexToRemove, 1);
    this.scene.removeObject(o);
    this.nonVisiblePlanes.push(o);
  }

  animationTimeoutCb() {

    const oldPlane = this.getOldPlane();
    if (!oldPlane) {
      console.warn('no oldPlane to animate from');
      return;
    }
    const newPlane = this.getNewPlane({ oldPlane });
    if (!newPlane) {
      console.warn('no newPlane to animate to');
      return;
    }
    this.setupNewPlane({ oldPlane, newPlane });

    const axis = this.getAxis({ oldPlane, newPlane });
    const direction = this.getDirection({ oldPlane, newPlane });
    const slideDuration = this.getSlideDuration();

    const distanceXOldPlane = (oldPlane) ? oldPlane.props.scale.x : 0;
    const distanceYOldPlane = (oldPlane) ? oldPlane.props.scale.y : 0;

    const setPropsNewPlane = {
      position: {
        x: newPlane.props.position.x,
        y: newPlane.props.position.y,
      },
      scale: {
        x: newPlane.props.scale.x,
        y: newPlane.props.scale.y,
      }
    };
    const targetPropsNewPlane = {
      position: {
        x: newPlane.props.position.x,
        y: newPlane.props.position.y,
      }
    };
    const targetPropsOldPlane = {
      position: {
        x: (oldPlane) ? oldPlane.props.position.x : 0,
        y: (oldPlane) ? oldPlane.props.position.y : 0,
      }
    };

    const isVertical = (axis === 'vertical');

    if (isVertical) {
      if (direction < 0) {
        targetPropsOldPlane.position.y += distanceYOldPlane;
        setPropsNewPlane.position.y -= setPropsNewPlane.scale.y;
      } else {
        targetPropsOldPlane.position.y -= distanceYOldPlane;
        setPropsNewPlane.position.y += setPropsNewPlane.scale.y;
      }
    } else {
      if (direction < 0) {
        targetPropsOldPlane.position.x -= distanceXOldPlane;
        setPropsNewPlane.position.x += setPropsNewPlane.scale.x;
      } else {
        targetPropsOldPlane.position.x += distanceXOldPlane;
        setPropsNewPlane.position.x -= setPropsNewPlane.scale.x;
      }
    }

    newPlane.applyProps(setPropsNewPlane);

    const tl = gsap.timeline({
      onUpdate: () => {
        if (oldPlane) {
          oldPlane.applyProps({
            position: {
              x: oldPlane.props.position.x,
              y: oldPlane.props.position.y
            }
          });
        }
        newPlane.applyProps({
          position: {
            x: newPlane.props.position.x,
            y: newPlane.props.position.y
          }
        });
      },
      onComplete: () => {
        this.removeObject(oldPlane);
      }
    });

    const delay = this.getSlideDelay();

    if (oldPlane) {
      tl.to(oldPlane.props.position, {...targetPropsOldPlane.position, duration: slideDuration, ease: DevineEasing.COLOR_PLANE, delay}, 0);
    }
    tl.to(newPlane.props.position, {...targetPropsNewPlane.position, duration: slideDuration, ease: DevineEasing.COLOR_PLANE, delay}, 0);

    this.addObject(newPlane);
  }

}

export { PlaneSlider };
