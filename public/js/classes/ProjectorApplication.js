import * as THREE from '../three.js/build/three.module.js';

import { Application } from './Application.js';

const BLACK = new THREE.Color(0, 0, 0);

class ProjectorApplication extends Application {

  setupApplicationSpecificUI() {
    this.scene = new THREE.Scene();

    this.fullSceneCamera = new THREE.OrthographicCamera(this.fullBounds.left, this.fullBounds.right, this.fullBounds.top, this.fullBounds.bottom, -2, 2);

    const outputCanvas = document.getElementById('output-canvas');
    outputCanvas.width = this.config.appDimensions.width;
    outputCanvas.height = this.config.appDimensions.height;
    this.renderer = new THREE.WebGLRenderer({canvas: outputCanvas, powerPreference: "high-performance"});
  }

  applicationSpecificRender() {
    // {
    //   this.fullSceneCamera.left = this.fullBounds.left;
    //   this.fullSceneCamera.right = this.fullBounds.right;
    //   this.fullSceneCamera.top = this.fullBounds.top;
    //   this.fullSceneCamera.bottom = this.fullBounds.bottom;
    //   this.renderer.setSize( this.fullBounds.width * 500, this.fullBounds.height * 500 );
    //   this.renderer.render( this.scene, this.fullSceneCamera );
    //   return;
    // }
    this.cameras.forEach(camera => {
      const screenConfig = this.screenConfigsById[camera.id];

      const left = Math.floor( this.config.appDimensions.width * screenConfig.output.left );
      const bottom = Math.floor( this.config.appDimensions.height * screenConfig.output.bottom );
      const width = Math.floor( this.config.appDimensions.width * screenConfig.output.width );
      const height = Math.floor( this.config.appDimensions.height * screenConfig.output.height );

      this.renderer.setViewport( left, bottom, width, height );
      this.renderer.setScissor( left, bottom, width, height );
      this.renderer.setScissorTest( true );
      this.renderer.setClearColor( BLACK );

      this.renderer.render( this.scene, camera.object3D );
    })
  }

  onSceneObjectAdded(object) {
    this.scene.add(object.object3D);
  }

  onSceneObjectRemoved(object) {
    this.scene.remove(object.object3D);
  }
}

export { ProjectorApplication }