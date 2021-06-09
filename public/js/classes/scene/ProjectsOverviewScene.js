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

          // this is reference to image
          image.plane.ctx.save();
          // create clipping path
          image.plane.ctx.beginPath();
          image.plane.ctx.rect(image.clip.x, image.clip.y, image.clip.width, image.clip.height);
          image.plane.ctx.closePath();
          image.plane.ctx.clip();
          // position the image
          image.plane.ctx.translate(image.x, image.y);
          image.plane.ctx.scale(image.scale, image.scale);
          image.plane.ctx.drawImage(image.el, 0, 0);
          image.plane.ctx.restore();

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
    const isFirstItemOnScreen = oldImage.isFirstItemOnScreen;
    const isLandscape = !(camera.props.rotation.z !== 0);
    // animate
    const tl = gsap.timeline({
      onUpdate: () => {
        // oldImage.draw();
        // newImage.draw();
        const plane = oldImage.plane;
        const clip = oldImage.clip;
        plane.ctx.save();
        // create clipping path
        plane.ctx.beginPath();
        plane.ctx.rect(clip.x, clip.y, clip.width, clip.height);
        plane.ctx.closePath();
        plane.ctx.clip();
        // draw the old image
        plane.ctx.save();
        plane.ctx.translate(oldImage.x, oldImage.y);
        plane.ctx.scale(oldImage.scale, oldImage.scale);
        plane.ctx.drawImage(oldImage.el, 0, 0);
        plane.ctx.restore();
        // draw the new image
        plane.ctx.save();
        plane.ctx.translate(newImage.x, newImage.y);
        plane.ctx.scale(newImage.scale, newImage.scale);
        plane.ctx.drawImage(newImage.el, 0, 0);
        plane.ctx.restore();
        plane.ctx.restore();

        plane.texture.needsUpdate = true;
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

    const props = this.generatePropsForScreen(camera, isFirstItemOnScreen);

    newImage.clip.x = props.position.x;
    newImage.clip.y = props.position.y;
    newImage.clip.width = props.size.x;
    newImage.clip.height = props.size.y;

    newImage.scale = oldImage.scale;

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
      newImage.y -= direction * newImage.el.height*newImage.scale;
    } else {
      // move horizontally
      targetPropsOldImage.x = direction * oldImage.el.width*oldImage.scale;
      newImage.x -= direction * newImage.el.width*newImage.scale;
    }

    tl.to(oldImage, {...targetPropsOldImage, duration: slideDuration, ease: Power1.easeInOut}, 0);
    tl.to(newImage, {...targetPropsNewImage, duration: slideDuration, ease: Power1.easeInOut}, 0);

    this.visibleImages.push(newImage);

    this.scheduleAnimationTimeout();
  };
}

export { ProjectsOverviewScene }