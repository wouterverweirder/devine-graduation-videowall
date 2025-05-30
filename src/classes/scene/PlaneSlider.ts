import { gsap } from 'gsap';
import { DevineEasing } from '../../consts/DevineEasing';
import { SceneObjectConfig } from '../../types';
import { SceneBase } from './SceneBase';
import { VisualBase } from './objects/VisualBase';

type VisualBaseWithIntro = VisualBase & { intro?: () => void };

type PlaneSliderConfig = {
  objectConfig?: SceneObjectConfig;
  nonVisiblePlanes?: VisualBaseWithIntro[];
  visiblePlanes?: VisualBaseWithIntro[];
  setupNewPlane?: ({ oldPlane, newPlane }: { oldPlane: VisualBaseWithIntro, newPlane: VisualBaseWithIntro }) => void;
  getAxis?: ({ oldPlane, newPlane }: { oldPlane: VisualBaseWithIntro, newPlane: VisualBaseWithIntro }) => 'horizontal' | 'vertical';
  getDirection?: ({ oldPlane, newPlane }: { oldPlane: VisualBaseWithIntro, newPlane: VisualBaseWithIntro }) => -1 | 1;
  getSlideDuration?: () => number;
  getSlideDelay?: () => number;
  getDelayForNextAnimation?: () => number;
  pickingMethod?: 'next' | 'random';
};

class PlaneSlider {

  scene:SceneBase;
  animationTimeoutId: ReturnType<typeof setTimeout> = 0 as unknown as ReturnType<typeof setTimeout>;
  nonVisiblePlanes: VisualBaseWithIntro[] = [];
  visiblePlanes: VisualBaseWithIntro[] = [];
  pickingMethod = 'next'; // or 'random'
  objectConfig: SceneObjectConfig;

  setupNewPlane:({ oldPlane, newPlane }: { oldPlane: VisualBaseWithIntro, newPlane: VisualBaseWithIntro }) => void = () => {};
  getAxis:({ oldPlane, newPlane }: { oldPlane: VisualBaseWithIntro, newPlane: VisualBaseWithIntro }) => 'horizontal' | 'vertical' = () => 'horizontal';
  getDirection:({ oldPlane, newPlane }: { oldPlane: VisualBaseWithIntro, newPlane: VisualBaseWithIntro }) => -1 | 1 = () => -1;
  getSlideDuration = () => 1;
  getSlideDelay = () => 0;
  getDelayForNextAnimation = () => 1;

  constructor(scene:SceneBase, {
    objectConfig,
    nonVisiblePlanes = [],
    visiblePlanes = [],
    setupNewPlane = () => {},
    getAxis = () => 'horizontal',
    getDirection = () => -1,
    getSlideDuration = () => 1,
    getSlideDelay = () => 0,
    getDelayForNextAnimation = () => 1,
    pickingMethod = 'next'
  }:PlaneSliderConfig = {}) {
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

  dispose() {
    this.stop();
  }

  scheduleAnimationTimeout() {
    this.killAnimationTimeout();
    const delayForNextAnimation = this.getDelayForNextAnimation();
    this.animationTimeoutId = setTimeout(() => {
      this.animationTimeoutCb();
      this.scheduleAnimationTimeout();
    }, delayForNextAnimation);
  }

  getNewPlane({ oldPlane }: { oldPlane?: VisualBaseWithIntro } = {}) {
    const newPlane = this.nonVisiblePlanes.shift();
    if (!newPlane) {
      return null;
    }
    if (oldPlane) {
      newPlane.customData.sliderScreen = oldPlane.customData.sliderScreen;
    }
    return newPlane;
  }

  getOldPlane() {
    const nonAnimatingVisiblePlanes = this.visiblePlanes.filter(o => !o.customData.isAnimating);
    if (this.pickingMethod === 'next') {
      return nonAnimatingVisiblePlanes[0];
    }
    // random
    const index = Math.floor(Math.random() * nonAnimatingVisiblePlanes.length);
    if (index >= nonAnimatingVisiblePlanes.length) {
      return;
    }
    return nonAnimatingVisiblePlanes[index];
  }

  addObject(o:VisualBase) {
    this.scene.addObject(o);
    this.visiblePlanes.push(o);
  }

  removeObject(o:VisualBase) {
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
    const newPlane = this.getNewPlane({ oldPlane }) as VisualBaseWithIntro;
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
        z: newPlane.props.position.z
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
        z: newPlane.props.position.z
      }
    };
    const targetPropsOldPlane = {
      position: {
        x: (oldPlane) ? oldPlane.props.position.x : 0,
        y: (oldPlane) ? oldPlane.props.position.y : 0,
        z: (oldPlane) ? oldPlane.props.position.z : 0
      }
    };

    const isVertical = (axis === 'vertical');

    if (isVertical) {
      if (direction < 0) {
        targetPropsOldPlane.position.y += distanceYOldPlane;
        setPropsNewPlane.position.y -= oldPlane.props.scale.y;
      } else {
        targetPropsOldPlane.position.y -= distanceYOldPlane;
        setPropsNewPlane.position.y += oldPlane.props.scale.y;
      }
    } else {
      if (direction < 0) {
        targetPropsOldPlane.position.x -= distanceXOldPlane;
        setPropsNewPlane.position.x += oldPlane.props.scale.x;
      } else {
        targetPropsOldPlane.position.x += distanceXOldPlane;
        setPropsNewPlane.position.x -= oldPlane.props.scale.x;
      }
    }

    newPlane.applyProps(setPropsNewPlane);

    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        if (oldPlane) {
          oldPlane.applyProps({
            position: {
              x: oldPlane.props.position.x,
              y: oldPlane.props.position.y,
              z: oldPlane.props.position.z
            }
          });
        }
        newPlane.applyProps({
          position: {
            x: newPlane.props.position.x,
            y: newPlane.props.position.y,
            z: newPlane.props.position.z
          }
        });
      },
      onComplete: () => {
        if (oldPlane) {
          oldPlane.customData.isAnimating = false;
          this.removeObject(oldPlane);
        }
        newPlane.customData.isAnimating = false;
      }
    });

    const delay = this.getSlideDelay();

    if (oldPlane) {
      tl.to(oldPlane.props.position, {...targetPropsOldPlane.position, duration: slideDuration, ease: DevineEasing.COLOR_PLANE, delay}, 0);
      oldPlane.customData.isAnimating = true;
    }
    tl.to(newPlane.props.position, {...targetPropsNewPlane.position, duration: slideDuration, ease: DevineEasing.COLOR_PLANE, delay}, 0);
    newPlane.customData.isAnimating = true;
    if (newPlane.intro) {
      newPlane.intro();
    }

    this.addObject(newPlane);

    tl.play();
  }

}

export { PlaneSlider };
