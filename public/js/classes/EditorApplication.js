import * as THREE from '../three.js/build/three.module.js';

import { Application } from './Application.js';

import { Editor } from '../three.js/editor/js/Editor.js';
import { Sidebar } from './editor/Sidebar.js';
import { Viewport } from '../three.js/editor/js/Viewport.js';

Number.prototype.format = function () {
  return this.toString().replace( /(\d)(?=(\d{3})+(?!\d))/g, "$1," );
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
    this.editor.signals.configChanged = new Signal();
    // 
    // request signals
    this.editor.signals.requestRemoveObject = new Signal();
    //
    this.editor.signals.rendererChanged.dispatch( editorRenderer );
    this.editor.signals.windowResize.dispatch();

    this.editor.signals.configChanged.add(() => {
      this.saveConfigs();
    });

    // clone children into the editor and link it together
    this.scene.children.forEach(child => {
      this.addChildToEditor(child);
    });

    // cameras
    this.cameras.forEach(camera => {
      const screen = this.screensById[camera.userData.id];
      
      const clonedCamera = camera.clone();
      this.editor.addObject(clonedCamera);
      const cameraHelper = this.editor.helpers[clonedCamera.id];

      const onChange = () => {
        // update the config
        screen.camera.position[0] = clonedCamera.position.x;
        screen.camera.position[1] = clonedCamera.position.y;
        screen.camera.position[2] = clonedCamera.position.z;
        camera.position.copy(clonedCamera.position);
        camera.quaternion.copy(clonedCamera.quaternion);
        camera.updateProjectionMatrix();
        clonedCamera.updateProjectionMatrix();
        cameraHelper.update();
      };
      clonedCamera.userData.onChange = onChange;
      onChange();
    });
    this.editor.signals.objectSelected.add((object) => {
      if (!object) {
        return;
      }
      if (!object.userData.onChange) {
        return;
      }
    });
    this.editor.signals.refreshSidebarObject3D.add((object) => {
      if (!object.userData.onChange) {
        return;
      }
      // trigger the onChange
      object.userData.onChange();
      this.editor.signals.configChanged.dispatch();
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

    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-0', type: 'image', url: 'assets/2532.png' });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-1', type: 'image', url: 'assets/2532.png' });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-2', type: 'image', url: 'assets/2532.png' });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-3', type: 'image', url: 'assets/2532.png' });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-4', type: 'image', url: 'assets/2532.png' });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-5', type: 'image', url: 'assets/2532.png' });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-6', type: 'image', url: 'assets/2532.png' });
    this.serverConnection.requestCreatePlaneOnScreen({ id: THREE.MathUtils.generateUUID(), screenId: 'screen-7', type: 'image', url: 'assets/2532.png' });
  }

  connectToServer = () => {
    let serverAddress = this.editor.config.getKey('serverAddress');
    this.serverConnection.connect(serverAddress);
  }

  onWindowResize = (event) => {
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
  };

  onSceneObjectChanged = (object) => {
    object.userData.onChange();
  }

  addChildToEditor = (child) => {
    const clonedChild = child.clone();
    clonedChild.userData.onChange = () => {
      child.position.copy(clonedChild.position);
      child.quaternion.copy(clonedChild.quaternion);
    }
    child.userData.editorChild = clonedChild;
    child.userData.onChange = () => {
      clonedChild.position.copy(child.position);
      clonedChild.quaternion.copy(child.quaternion);
      clonedChild.scale.copy(child.scale);
    };
    this.editor.addObject(clonedChild);
  };

  saveConfigs = () => {
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