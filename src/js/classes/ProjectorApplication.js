import * as THREE from '../three.js/build/three.module.js';

import { Application } from './Application.js';
import { calculateScaleForScreenConfig, getBoundsForSize } from '../functions/screenUtils.js';

const BLACK = new THREE.Color(0, 0, 0);

class ProjectorApplication extends Application {

  interactionTimeoutId = false;
  isSingleProjection = false;
  ambientAudio = false;

  setupApplicationSpecificUI() {

    this.ambientAudio = document.createElement('audio');
    this.ambientAudio.src = 'assets/ambient-01.mp3';
    this.ambientAudio.loop = true;
    this.ambientAudio.volume = 0.1;

    this.isSingleProjection = (this.argv.projection !== 'multi');
    this.scene = new THREE.Scene();

    const outputCanvas = document.getElementById('output-canvas');
    outputCanvas.width = this.config.appDimensions.width;
    outputCanvas.height = this.config.appDimensions.height;
    this.renderer = new THREE.WebGLRenderer({canvas: outputCanvas, powerPreference: "high-performance"});

    if (this.isSingleProjection) {
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
    }

    if (!this.isControlledThroughWebsocket() && this.isSingleProjection) {
      // add next project button
      const nextProjectButton = document.createElement('button');
      nextProjectButton.innerHTML = 'Next project';
      nextProjectButton.style.position = 'absolute';
      nextProjectButton.style.top = '10px';
      nextProjectButton.style.left = '10px';
      nextProjectButton.style.zIndex = '100';
      nextProjectButton.addEventListener('click', () => {
        this.currentProjectIndex++;
        if (this.currentProjectIndex >= this.students.length) {
          this.currentProjectIndex = 0;
        }
        this.onRequestShowProject(this.students[this.currentProjectIndex]);
      }
      );
      document.body.appendChild(nextProjectButton);
    }

    this.resetScreensaver();
  }

  resetScreensaver() {
    clearTimeout(this.interactionTimeoutId);
    this.interactionTimeoutId = setTimeout(() => {
      this.startScreensaver();
    }, this.config.interactionTimeout);
  }

  startScreensaver() {
    this.serverConnection.requestShowProjectsOverview();
  }

  applicationSpecificRender() {
    if (this.isSingleProjection) {
      this.renderer.setSize( this.fullBounds.width * 500, this.fullBounds.height * 500 );

      this.cameras.forEach(camera => {
        const screenConfig = this.screenConfigsById[camera.id];
        const cameraScale = calculateScaleForScreenConfig(screenConfig);

        let rotation = 0;
        if (screenConfig.camera.rotation) {
          rotation = screenConfig.camera.rotation;
        }
        const isLandscape = (rotation === 0);

        const left = (Math.abs(this.fullBounds.left) + camera.props.position.x - cameraScale.x / 2) * 500;
        const bottom = (Math.abs(this.fullBounds.bottom) + camera.props.position.y - cameraScale.y / 2) * 500;

        const width = cameraScale.x * 500;
        const height = cameraScale.y * 500;
  
        this.renderer.setViewport( left, bottom, width, height );
        this.renderer.setScissor( left, bottom, width, height );
        this.renderer.setScissorTest( true );
        this.renderer.setClearColor( BLACK );

        const origCameraProperties = {
          rotationZ: camera.object3D.rotation.z,
          left: camera.object3D.left,
          right: camera.object3D.right,
          top: camera.object3D.top,
          bottom: camera.object3D.bottom,
        };

        if (!isLandscape) {
          camera.object3D.rotation.z = 0;

          camera.object3D.right *= 9/16;
          camera.object3D.left *= 9/16;
          camera.object3D.top *= 16/9;
          camera.object3D.bottom *= 16/9;

          camera.object3D.updateProjectionMatrix();
        }
  
        this.renderer.render( this.scene, camera.object3D );

        camera.object3D.left = origCameraProperties.left;
        camera.object3D.right = origCameraProperties.right;
        camera.object3D.top = origCameraProperties.top;
        camera.object3D.bottom = origCameraProperties.bottom;
        camera.object3D.rotation.z = origCameraProperties.rotationZ;
        camera.object3D.updateProjectionMatrix();
      });
      return;
    }
    this.cameras.forEach(camera => {
      const screenConfig = this.screenConfigsById[camera.id];

      const left = Math.floor( this.config.appDimensions.width * screenConfig.output.left );
      const bottom = Math.floor( this.config.appDimensions.height * screenConfig.output.bottom );
      const width = Math.floor( this.config.appDimensions.width * screenConfig.output.width );
      const height = Math.floor( this.config.appDimensions.height * screenConfig.output.height );
      const crop = Math.floor(isNaN(this.config.crop) ? 0 : this.config.crop);

      this.renderer.setViewport( left, bottom, width, height );
      this.renderer.setScissor( left + crop, bottom + crop, width - crop*2, height - crop*2 );
      this.renderer.setScissorTest( true );
      this.renderer.setClearColor( BLACK );

      this.renderer.render( this.scene, camera.object3D );
    });
  }

  onSceneObjectAdded(object) {
    this.scene.add(object.object3D);
  }

  onSceneObjectRemoved(object) {
    this.scene.remove(object.object3D);
  }

  async onRequestKeyPressed(event) {
    // reset the screen saver
    this.resetScreensaver();
  }

  async onRequestShowProjectsOverview () {
    await super.onRequestShowProjectsOverview();

    if (this.ambientAudio) {
      this.ambientAudio.play();
    }
  }

  async onRequestShowProject(project) {
    if (this.ambientAudio) {
      this.ambientAudio.pause();
    }
    await super.onRequestShowProject(project);
  }
}

export { ProjectorApplication }