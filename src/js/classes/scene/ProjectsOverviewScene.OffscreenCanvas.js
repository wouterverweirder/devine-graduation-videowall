import { gsap, Power1 } from '../../gsap/src/index.js';

import { getScreenCamerasForRoles } from "../../functions/screenUtils.js";
import { createPlaneForScreen } from "../../functions/createPlaneForScreen.js";
import { ScreenRole } from "../../consts/ScreenRole.js";
import { SceneBase, SceneState } from "./SceneBase.js";
import { loadImage } from '../../functions/loadImage.js';
import { PlaneType } from '../../consts/PlaneType.js';

const loadProfilePictureWithVariants = async (url) => {
  const picture = {};
  picture.orig = await loadImage(url);
  // resized and scaled versions
  const scale = 9 / 16;
  picture.forLandscapeStack = new OffscreenCanvas(1920/2, 1080);
  {
    const ctx = picture.forLandscapeStack.getContext('2d');
    ctx.scale(scale, scale);
    ctx.translate((ctx.canvas.width - picture.orig.width * scale) / 2, (ctx.canvas.height - picture.orig.height * scale) / 2);
    ctx.drawImage(picture.orig, 0, 0);
  }
  picture.forPortraitStack = new OffscreenCanvas(1080, 1920/2);
  {
    const ctx = picture.forPortraitStack.getContext('2d');
    ctx.scale(scale, scale);
    ctx.translate((ctx.canvas.width - picture.orig.width * scale) / 2, (ctx.canvas.height - picture.orig.height * scale) / 2);
    ctx.drawImage(picture.orig, 0, 0);
  }
  return picture;
};

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

        const picture = await loadProfilePictureWithVariants(project.profilePicture.url);
        const image = {
          picture,
          x: 0,
          y: 0
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
          screenConfig,
          appConfig: this.config
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

          const isLandscape = !(camera.props.rotation.z !== 0);

          const props = this.generatePropsForScreen(camera, isFirstItemOnScreen);

          image.x = props.position.x;
          image.y = props.position.y;

          if (isLandscape) {
            image.plane.ctx.drawImage(image.picture.forLandscapeStack, image.x, image.y);
          } else {
            image.plane.ctx.drawImage(image.picture.forPortraitStack, image.x, image.y);
          }

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

        if (isLandscape) {
          oldImage.plane.ctx.drawImage(oldImage.picture.forLandscapeStack, oldImage.x, oldImage.y);
          newImage.plane.ctx.drawImage(newImage.picture.forLandscapeStack, newImage.x, newImage.y);
        } else {
          oldImage.plane.ctx.drawImage(oldImage.picture.forPortraitStack, oldImage.x, oldImage.y);
          newImage.plane.ctx.drawImage(newImage.picture.forPortraitStack, newImage.x, newImage.y);
        }

        newImage.plane.texture.needsUpdate = true;
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

    const slideDuration = 2;
    const targetPropsOldImage = {};
    const targetPropsNewImage = {
      x: oldImage.x,
      y: oldImage.y
    };
    const direction = (Math.random() < .5) ? 1 : -1;
    if (isLandscape) {
      // move vertically
      targetPropsOldImage.y = direction * oldImage.picture.forLandscapeStack.height;
      newImage.y -= direction * newImage.picture.forLandscapeStack.height;
    } else {
      // move horizontally
      targetPropsOldImage.x = direction * oldImage.picture.forPortraitStack.width;
      newImage.x -= direction * newImage.picture.forPortraitStack.width;
    }

    tl.to(oldImage, {...targetPropsOldImage, duration: slideDuration, ease: Power1.easeInOut}, 0);
    tl.to(newImage, {...targetPropsNewImage, duration: slideDuration, ease: Power1.easeInOut}, 0);

    this.visibleImages.push(newImage);

    this.scheduleAnimationTimeout();
  };
}

export { ProjectsOverviewScene }