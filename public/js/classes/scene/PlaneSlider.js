import * as THREE from '../../three.js/build/three.module.js';
import { gsap } from '../../gsap/src/index.js';
import { DevineEasing } from '../../consts/DevineEasing.js';

class PlaneSlider {

  animationTimeoutId = false;

  constructor() {
  }

  stop(){
    this.killAnimationTimeout();
  }

  /**
    {
      addObject = () => {},
      removeObject = () => {},
      getNewPlane = ({ oldPlane }) => {},
      getOldPlane = () => {},
      getAxis = ({ oldPlane, newPlane }) => 'horizontal',
      getDirection = ({ oldPlane, newPlane }) => -1,
      getDelayForNextAnimation = () => -1,
    }
   */
  start(params) {
    this.scheduleAnimationTimeout(params);
  }

  killAnimationTimeout() {
    clearTimeout(this.animationTimeoutId);
  }

  scheduleAnimationTimeout(params) {
    const { getDelayForNextAnimation } = params;
    this.killAnimationTimeout();
    const delayForNextAnimation = getDelayForNextAnimation();
    this.animationTimeoutId = setTimeout(() => {
      this.animationTimeoutCb(params);
      this.scheduleAnimationTimeout(params);
    }, delayForNextAnimation);
  };

  animationTimeoutCb({
    addObject = () => {},
    removeObject = () => {},
    getNewPlane = ({ oldPlane }) => {},
    getOldPlane = () => {},
    getAxis = ({ oldPlane, newPlane }) => 'horizontal',
    getDirection = ({ oldPlane, newPlane }) => -1,
    getSlideDuration = () => 1
  } = params) {

    const oldPlane = getOldPlane();
    const newPlane = getNewPlane({ oldPlane });
    if (!newPlane) {
      console.warn('no newPlane to animate to');
      return;
    }

    const axis = getAxis({ oldPlane, newPlane });
    const direction = getDirection({ oldPlane, newPlane });
    const slideDuration = getSlideDuration();

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
          oldPlane.applyProps(oldPlane.props);
        }
        newPlane.applyProps(newPlane.props);
      },
      onComplete: () => {
        removeObject(oldPlane);
      }
    });

    if (oldPlane) {
      tl.to(oldPlane.props.position, {...targetPropsOldPlane.position, duration: slideDuration, ease: DevineEasing.COLOR_PLANE}, 0);
    }
    tl.to(newPlane.props.position, {...targetPropsNewPlane.position, duration: slideDuration, ease: DevineEasing.COLOR_PLANE}, 0);

    addObject(newPlane);
  }

}

export { PlaneSlider }