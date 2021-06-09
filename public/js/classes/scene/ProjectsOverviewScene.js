import { gsap, Power1 } from '../../gsap/src/index.js';

import { getScreenCamerasForRoles, calculateScaleForScreenConfig } from "../../functions/screenUtils.js";
import { createPlaneForScreen } from "../../functions/createPlaneForScreen.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { ImagePlane } from './objects/ImagePlane.js';
import { loadImage } from '../../functions/loadImage.js';
import { PlaneType } from '../../consts/PlaneType.js';

class ProjectsOverviewScene extends SceneBase {

  screenPlanes = [];
  allProjectImages = [];
  nonVisibleImages = [];
  visibleImages = [];
  animationTimeoutId = false;

  async _executeStateName(stateName) {
    if (stateName === SceneState.LOAD) {

      // load all images
      for (let index = 0; index < this.projects.length; index++) {
        const project = this.projects[index];
        const el = await loadImage(project.profilePicture.url);
        const image = {
          el,
          x: 0,
          y: 0,
          scale: 9/16,
          clip: {
            x: 0,
            y: 0,
            width: el.width,
            height: el.height
          }
        };
        const draw = function() {
          if (!this.plane) {
            return;
          }
          // this is reference to image
          this.plane.ctx.save();
          // create clipping path
          this.plane.ctx.beginPath();
          this.plane.ctx.rect(this.clip.x, this.clip.y, this.clip.width, this.clip.height);
          this.plane.ctx.closePath();
          this.plane.ctx.clip();
          // position the image
          this.plane.ctx.translate(this.x, this.y);
          this.plane.ctx.scale(this.scale, this.scale);
          this.plane.ctx.drawImage(this.el, 0, 0);
          this.plane.ctx.restore();

          this.plane.texture.needsUpdate = true;
        };
        image.draw = draw.bind(image);
        this.allProjectImages.push(image);
        this.nonVisibleImages.push(image);
      }
    } else if (stateName === SceneState.INTRO) {
      const cameras = getScreenCamerasForRoles(this.cameras, [
        ScreenRole.PROFILE_PICTURE,
        ScreenRole.PROJECT_BIO,
        ScreenRole.PROJECT_DESCRIPTION,
        ScreenRole.PORTRAIT_SCREENSHOTS,
        ScreenRole.LANDSCAPE_SCREENSHOTS,
        ScreenRole.VIDEOS,
      ]);
      // create a screen plane per camera
      for (const camera of cameras) {
        const screenConfig = this.screenConfigsById[camera.id];
        const screenPlane = await createPlaneForScreen({
          data: {
            id: `project-overview-screen-${camera.id}`,
            type: PlaneType.CANVAS,
            color: 0x000000,
          },
          screenConfig
        });
        await screenPlane.init();
        this.screenPlanes.push(screenPlane);

        for (let i = 0; i < 2; i++) {
          if (this.nonVisibleImages.length === 0) {
            break;
          }
          const isFirstItemOnScreen = (i === 0);
          const image = this.nonVisibleImages.shift();
          image.plane = screenPlane;
          image.camera = camera;
          image.isFirstItemOnScreen = isFirstItemOnScreen;

          const props = this.generatePropsForScreen(camera, isFirstItemOnScreen);

          image.clip.x = props.position.x;
          image.clip.y = props.position.y;
          image.clip.width = props.size.x;
          image.clip.height = props.size.y;

          image.x = image.clip.x + (image.clip.width - image.el.width*image.scale) / 2;
          image.y = image.clip.y + (image.clip.height - image.el.height*image.scale) / 2;

          image.draw();

          this.visibleImages.push(image);
        }

        screenPlane.texture.needsUpdate = true;
      }

      this.screenPlanes.forEach(plane => {
        this.addObject(plane);
      });

      // start the animation timeout
      this.scheduleAnimationTimeout();

    } else if (stateName === SceneState.OUTRO) {
      this.killAnimationTimeout();
      this.screenPlanes.forEach(plane => {
        this.removeObject(plane);
      });
    }
  }

  generatePropsForScreen(camera, isFirstItemOnScreen) {
    const isLandscape = !(camera.props.rotation.z !== 0);
    const position = {
      x: 0,
      y: 0
    };
    const size = {
      x: 1920 / 2,
      y: 1920 / 2
    }
    if (isLandscape) {
      size.y = 1080;
      position.x += isFirstItemOnScreen ? 0 : 1920 / 2;
    } else {
      size.x = 1080;
      position.y += isFirstItemOnScreen ? 0 : 1920 / 2;
    }
    return {
      position,
      size
    };
  };

  killAnimationTimeout() {
    clearTimeout(this.animationTimeoutId);
  };

  scheduleAnimationTimeout() {
    console.log(this.config.scenes.projectsOverview.updateInterval);
    this.killAnimationTimeout();
    this.animationTimeoutId = setTimeout(() => {
      this.animationTimeoutCb();
    }, this.config.scenes.projectsOverview.updateInterval);
  };

  animationTimeoutCb() {
    if (this.nonVisibleImages.length === 0) {
      return;
    }
    // choose a random item to replace
    const index = Math.floor(Math.random() * this.visibleImages.length);
    if (index >= this.visibleImages.length) {
      return;
    }
    const oldImage = this.visibleImages[index];
    const newImage = this.nonVisibleImages.shift();

    newImage.camera = oldImage.camera;
    newImage.isFirstItemOnScreen = oldImage.isFirstItemOnScreen;
    newImage.plane = oldImage.plane;

    const camera = oldImage.camera;
    const isLandscape = !(camera.props.rotation.z !== 0);
    // animate
    const tl = gsap.timeline({
      onUpdate: () => {
        oldImage.draw();
        newImage.draw();
      },
      onComplete: () => {
        const indexToRemove = this.visibleImages.indexOf(oldImage);
        if (indexToRemove >= this.visibleImages.length) {
          return;
        }
        this.visibleImages.splice(indexToRemove, 1);
        this.nonVisibleImages.push(oldImage);
      }
    });

    newImage.x = oldImage.x;
    newImage.y = oldImage.y;
    newImage.scale = oldImage.scale;
    newImage.clip.x = oldImage.clip.x;
    newImage.clip.x = oldImage.clip.x;
    newImage.clip.width = oldImage.clip.width;
    newImage.clip.height = oldImage.clip.height;

    const slideDuration = 2;
    const targetPropsOldImage = {};
    const targetPropsNewImage = {
      x: oldImage.x,
      y: oldImage.y
    };
    const direction = (Math.random() < .5) ? 1 : -1;
    if (isLandscape) {
      // move vertically
      targetPropsOldImage.y = direction * oldImage.el.height*oldImage.scale;
      newImage.y = oldImage.y - direction * oldImage.el.height*oldImage.scale;
    } else {
      // move horizontally
      targetPropsOldImage.x = direction * oldImage.el.width*oldImage.scale;
      newImage.x = oldImage.x - direction * oldImage.el.width*oldImage.scale;
    }

    tl.to(oldImage, {...targetPropsOldImage, duration: slideDuration, ease: Power1.easeInOut}, 0);
    tl.to(newImage, {...targetPropsNewImage, duration: slideDuration, ease: Power1.easeInOut}, 0);

    // const targetPropsOldImage = {
    //   position: {
    //     x: oldImage.x,
    //     y: oldImage.y,
    //   },
    //   scale: {
    //     x: oldImage.props.scale.x,
    //     y: oldImage.props.scale.y,
    //   },
    // };
    // const setPropsOldImage = {
    //   anchor: {
    //     x: 0.5,
    //     y: 0.5
    //   }
    // };
    // const setPropsNewPlane = this.generatePropsForScreen(camera, newImage.isFirstItemOnScreen);
    // const targetPropsNewPlane = JSON.parse(JSON.stringify(setPropsNewPlane));

    // const slideDuration = 2;
    // if (isLandscape) {
    //   targetPropsOldImage.scale.y = 0;
    //   if (setPropsNewPlane.anchor.y < .5) {
    //     setPropsOldImage.anchor.y = 1;
    //     targetPropsOldImage.position.y += oldImage.props.scale.y / 2;
    //     setPropsNewPlane.position.y -= setPropsNewPlane.scale.y / 2;
    //   } else {
    //     setPropsOldImage.anchor.y = 0;
    //     targetPropsOldImage.position.y -= oldImage.props.scale.y / 2;
    //     setPropsNewPlane.position.y += setPropsNewPlane.scale.y / 2;
    //   }
    //   setPropsNewPlane.scale.y = 0;
    // } else {
    //   targetPropsOldImage.scale.x = 0;
    //   if (setPropsNewPlane.anchor.x < .5) {
    //     setPropsOldImage.anchor.x = 1;
    //     targetPropsOldImage.position.x -= oldImage.props.scale.x / 2;
    //     setPropsNewPlane.position.x += setPropsNewPlane.scale.x / 2;
    //   } else {
    //     setPropsOldImage.anchor.x = 0;
    //     targetPropsOldImage.position.x += oldImage.props.scale.x / 2;
    //     setPropsNewPlane.position.x -= setPropsNewPlane.scale.x / 2;
    //   }
    //   setPropsNewPlane.scale.x = 0;
    // }
    // oldImage.applyProps(setPropsOldImage);
    // newImage.applyProps(setPropsNewPlane);

    // tl.to(oldImage.props.scale, {...targetPropsOldImage.scale, duration: slideDuration, ease: Power1.easeInOut}, 0);
    // tl.to(oldImage.props.position, {...targetPropsOldImage.position, duration: slideDuration, ease: Power1.easeInOut}, 0);

    // tl.to(newImage.props.scale, {...targetPropsNewPlane.scale, duration: slideDuration, ease: Power1.easeInOut}, 0);
    // tl.to(newImage.props.position, {...targetPropsNewPlane.position, duration: slideDuration, ease: Power1.easeInOut}, 0);

    this.visibleImages.push(newImage);

    this.scheduleAnimationTimeout();
  };
}

export { ProjectsOverviewScene }