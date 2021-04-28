import * as THREE from '../three.js/build/three.module.js';

import { Application } from './Application.js';

const BLACK = new THREE.Color(0, 0, 0);

class ProjectorApplication extends Application {

  setupApplicationSpecificUI = () => {
    const outputCanvas = document.getElementById('output-canvas');
    outputCanvas.width = this.config.appDimensions.width;
    outputCanvas.height = this.config.appDimensions.height;
    this.renderer = new THREE.WebGLRenderer({canvas: outputCanvas, powerPreference: "high-performance"});
  }

  connectToServer = () => {
    this.serverConnection.connect('127.0.0.1');
  }

  applicationSpecificRender = () => {
    this.cameras.forEach(camera => {
      const screenConfig = this.screenConfigsById[camera.userData.id];

      const left = Math.floor( this.config.appDimensions.width * screenConfig.output.left );
      const bottom = Math.floor( this.config.appDimensions.height * screenConfig.output.bottom );
      const width = Math.floor( this.config.appDimensions.width * screenConfig.output.width );
      const height = Math.floor( this.config.appDimensions.height * screenConfig.output.height );

      this.renderer.setViewport( left, bottom, width, height );
      this.renderer.setScissor( left, bottom, width, height );
      this.renderer.setScissorTest( true );
      this.renderer.setClearColor( BLACK );

      this.renderer.render( this.scene, camera );
    })
  };
}

export { ProjectorApplication }