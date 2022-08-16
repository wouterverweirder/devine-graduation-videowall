import * as THREE from '../three.js/build/three.module.js';

import { Application } from './Application.js';

import { Editor } from '../three.js/editor/js/Editor.js';
import { Config } from '../three.js/editor/js/Config.js';
import { Sidebar } from './editor/Sidebar.js';
import { Viewport } from '../three.js/editor/js/Viewport.js';
import { getSizeForBounds } from '../functions/screenUtils.js';

Number.prototype.format = function () {
  return this.toString().replace( /(\d)(?=(\d{3})+(?!\d))/g, "$1," );
};

class EditorApplication extends Application {

  $editorContainer;
  editor;

  async init() {
    this.editorConfig = new Config();
    return super.init();
  }

  setupApplicationSpecificUI() {
    this.$editorContainer = document.getElementById('editor-container');
    this.editor = new Editor();
    this.editor.serverConnection = this.serverConnection;
    this.editor.camera.position.fromArray([1.57, 2.72, 5.47]);
    this.editor.camera.lookAt(0, 0, 0);

    const viewport = new Viewport( this.editor );
    this.$editorContainer.appendChild( viewport.dom );

    const sidebar = new Sidebar( this.editor );
    document.body.appendChild( sidebar.dom );
    
    const editorRenderer = new THREE.WebGLRenderer( { antialias: false } );
    //
    this.editor.signals.rendererChanged.dispatch( editorRenderer );
    this.editor.signals.windowResize.dispatch();

    // clone cameras into the editor
    this.cameras.forEach(camera => {
      this.addCameraToEditor(camera);
    });
  
    document.addEventListener('keydown', (event) => this.onKeyDown(event), false );
    window.addEventListener( 'resize', (event) => this.onWindowResize(event), false );
    this.onWindowResize();
  }

  onServerConnectionOpen() {
    // this.serverConnection.requestClearScene();

    // const project = this.projects[0];

    // this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-0', type: 'project-description', data: project });
    // this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-1', type: 'project-description', data: project });
    // this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-2', type: 'project-description', data: project });
    // this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-3', type: 'project-description', data: project });
    // this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-4', type: 'project-description', data: project });
    // this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-5', type: 'project-description', data: project });
    // this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-6', type: 'project-description', data: project });
    // this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-7', type: 'project-description', data: project });
  }

  getServerAddress() {

    let serverAddress = this.editorConfig.getKey('serverAddress');
    if (!serverAddress) {
      serverAddress = '127.0.0.1';
      this.editorConfig.setKey('serverAddress', serverAddress);
    }
    return serverAddress;
  }

  onWindowResize() {
    this.editor.signals.windowResize.dispatch();
  }

  onKeyDown(event) {
    switch ( event.key.toLowerCase() ) {
      case 'backspace':
      case 'delete':
        const object = this.editor.selected;
        if ( !object ) return;
        if ( !object.userData.sceneObject ) return;

        this.serverConnection.requestRemoveObject({ id: object.userData.sceneObject.id });
        this.editor.deselect();
        break;
    }
  }

  onSceneObjectRender(object) {
    // disable layers
    object.object3D.layers.enableAll();
  }

  onSceneObjectAdded(object) {
    this.editor.addObject(object.object3D);
  }

  onSceneObjectRemoved(object) {
    this.editor.removeObject(object.object3D);
  }

  addCameraToEditor(camera) {
    this.editor.addObject(camera.object3D);
    // when camera props change => save to config
    camera.signals.onPropsApplied.add(() => {
      const screenConfig = this.screenConfigsById[camera.id];
      screenConfig.camera.position[0] = camera.props.position.x;
      screenConfig.camera.position[1] = camera.props.position.y;
      screenConfig.camera.position[2] = camera.props.position.z;
      screenConfig.camera.rotation = camera.props.rotation.z;
      screenConfig.camera.size = getSizeForBounds(camera.props);
      screenConfig.roles = camera.props.roles;
      this.saveConfigs();
    });
  }

  saveConfigs() {
    // console.log(Date.now(), 'save config');
    const json = {...this.config};
    this.serverConnection.sendRequest({
      type: 'save-config',
      json
    });
  }

  applicationSpecificRender() {
    this.editor.signals.applicationRendered.dispatch();
  }
}

export { EditorApplication }