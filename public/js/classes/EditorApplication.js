import * as THREE from '../three.js/build/three.module.js';

import { Application } from './Application.js';

import { Editor } from '../three.js/editor/js/Editor.js';
import { Sidebar } from './editor/Sidebar.js';
import { Viewport } from '../three.js/editor/js/Viewport.js';
import { getSizeForBounds } from '../functions/createCamerasForConfig.js';

Number.prototype.format = function () {
  return this.toString().replace( /(\d)(?=(\d{3})+(?!\d))/g, "$1," );
};

const copyTransformsFromTo = (fromObject, toObject) => {
  toObject.position.copy(fromObject.position);
  toObject.quaternion.copy(fromObject.quaternion);
  toObject.scale.copy(fromObject.scale);
};

class EditorApplication extends Application {

  $editorContainer;
  editor;

  setupApplicationSpecificUI = () => {
    this.$editorContainer = document.getElementById('editor-container');
    this.editor = new Editor();
    let serverAddress = this.editor.config.getKey('serverAddress');
    if (!serverAddress) {
      serverAddress = '127.0.0.1';
      this.editor.config.setKey('serverAddress', serverAddress);
    }
    this.editor.serverConnection = this.serverConnection;
    this.editor.camera.position.fromArray([23, 66, 37]);
    this.editor.camera.lookAt(0, 0, 0);

    const Signal = signals.Signal;

    const viewport = new Viewport( this.editor );
    this.$editorContainer.appendChild( viewport.dom );

    const sidebar = new Sidebar( this.editor );
    document.body.appendChild( sidebar.dom );
    
    const editorRenderer = new THREE.WebGLRenderer( { antialias: false } );
    // 
    // request signals
    this.editor.signals.requestRemoveObject = new Signal();
    //
    this.editor.signals.rendererChanged.dispatch( editorRenderer );
    this.editor.signals.windowResize.dispatch();

    // clone children into the editor and link it together
    this.scene.children.forEach(child => {
      this.addChildToEditor(child);
    });

    // clone cameras into the editor
    this.cameras.forEach(camera => {
      this.addCameraToEditor(camera);
    });

    this.editor.signals.refreshSidebarObject3D.add((object) => {
      if (!object.userData.onChange) {
        return;
      }
      // trigger the onChange
      object.userData.onChange();
    });
    // request signals
    this.editor.signals.requestRemoveObject.add((userData) => {
      this.serverConnection.requestRemoveObject(userData);
    });
  
    document.addEventListener('keydown', this.onKeyDown, false );
    window.addEventListener( 'resize', this.onWindowResize, false );
    this.onWindowResize();
  }

  onServerConnectionOpen = () => {
    this.serverConnection.requestClearScene();

    const project = this.projects[0];

    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-0', type: 'project-description', data: project });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-1', type: 'project-description', data: project });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-2', type: 'project-description', data: project });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-3', type: 'project-description', data: project });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-4', type: 'project-description', data: project });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-5', type: 'project-description', data: project });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-6', type: 'project-description', data: project });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-7', type: 'project-description', data: project });
  }

  connectToServer = () => {
    let serverAddress = this.editor.config.getKey('serverAddress');
    this.serverConnection.connect(serverAddress);
  }

  onWindowResize = () => {
    this.editor.signals.windowResize.dispatch();
  };

  onKeyDown = (event) => {
    switch ( event.key.toLowerCase() ) {
      case 'backspace':
      case 'delete':
        const object = this.editor.selected;
        if ( !object ) return;
        if ( !object.userData.type || object.userData.type === 'screen' ) return;

        this.serverConnection.requestRemoveObject(object.userData);
        this.editor.deselect();
        break;
    }
  };

  onSceneObjectAdded = (object) => {
    this.addChildToEditor(object);
  }

  onSceneObjectRemoved = (object) => {
    if (object.userData.editorChild) {
      this.editor.removeObject(object.userData.editorChild);
    }
  }

  onSceneObjectPropsChanged = (object) => {
    if (object.userData.editorChild) {
      copyTransformsFromTo(object, object.userData.editorChild);
    }
  }

  addCameraToEditor = (camera) => {
    const screenConfig = this.screenConfigsById[camera.userData.id];
      
    const clonedCamera = camera.clone();
    this.editor.addObject(clonedCamera);
    const cameraHelper = this.editor.helpers[clonedCamera.id];

    clonedCamera.userData.onChange = () => {
      // console.log('editor camera changed');
      // update the config
      screenConfig.camera.position[0] = clonedCamera.position.x;
      screenConfig.camera.position[1] = clonedCamera.position.y;
      screenConfig.camera.position[2] = clonedCamera.position.z;
      const size = getSizeForBounds(clonedCamera);
      screenConfig.camera.size.width = size.width;
      screenConfig.camera.size.height = size.height;
      // update the projector instance
      copyTransformsFromTo(clonedCamera, camera);
      camera.updateProjectionMatrix();
      clonedCamera.updateProjectionMatrix();
      cameraHelper.update();
      this.saveConfigs();
    };
  };

  addChildToEditor = (child) => {
    const clonedChild = child.clone();
    this.editor.addObject(clonedChild);

    clonedChild.userData.onChange = () => {
      copyTransformsFromTo(clonedChild, child);
    }
    
    child.userData.editorChild = clonedChild;
  };

  saveConfigs = () => {
    // console.log(Date.now(), 'save config');
    const json = {...this.config};
    this.serverConnection.sendRequest({
      type: 'save-config',
      json
    });
  };

  applicationSpecificRender = () => {
    this.editor.signals.applicationRendered.dispatch();
  }
}

export { EditorApplication }