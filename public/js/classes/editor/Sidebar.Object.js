import * as THREE from '../../three.js/build/three.module.js';
import { UIPanel, UIRow, UIText, UINumber, UIBreak } from '../../three.js/editor/js/libs/ui.js';
import { SetPositionCommand } from '../../three.js/editor/js/commands/SetPositionCommand.js';
import { SetValueCommand } from '../../three.js/editor/js/commands/SetValueCommand.js';
import { getBoundsForSize } from '../../functions/createCamerasForConfig.js';

function SidebarObject( editor ) {

  const signals = editor.signals;

  const container = new UIPanel();
  container.setDisplay( 'none' );

  const objectIdRow = new UIRow();
  const objectId = new UIText();
  objectIdRow.add( new UIText( 'Id' ).setWidth( '90px' ) );
  objectIdRow.add( objectId );
  container.add( objectIdRow );

  const objectPositionRow = new UIRow();
  const objectPositionX = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( () => update() );
  const objectPositionY = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( () => update() );
  const objectPositionZ = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( () => update() );
  objectPositionRow.add( new UIText( 'Position' ).setWidth( '90px' ) );
  objectPositionRow.add( objectPositionX, objectPositionY, objectPositionZ );
  container.add( objectPositionRow );

  const screenSizeRow = new UIRow();

  const screenWidth = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( () => update(screenWidth) );
  const screenHeight = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( () => update(screenHeight) );
  screenSizeRow.add( new UIText( 'Size' ).setWidth( '90px' ) );
  screenSizeRow.add( screenWidth, screenHeight );
  container.add( screenSizeRow );

  // const outliner = new UIOutliner( editor );
  // outliner.setId( 'outliner' );
  // outliner.onChange( function () {
  //   console.log(outliner.getValue());
  // } );
  // outliner.onDblClick( function () {
  // } );
  // container.add( outliner );

  // container.add( new UIBreak() );

  // const newPlaneRow = new UIRow();
  // const newPlaneButton = new UIButton().setLabel('New Plane');
  // newPlaneButton.onClick(() => {
  //   console.log('new plane');
  // });
  // newPlaneRow.add(newPlaneButton);
  // container.add(newPlaneRow);

  function update(uiInput = null) {

    const object = editor.selected;

    if ( object === null) {
      // don't do anything when no object is selected
      return;
    }

    let needsConfigChange = false;

    const newPosition = new THREE.Vector3( objectPositionX.getValue(), objectPositionY.getValue(), objectPositionZ.getValue() );
    if ( object.position.distanceTo( newPosition ) >= 0.01 ) {
      needsConfigChange = true;
      editor.execute( new SetPositionCommand( editor, object, newPosition ) );
    }

    const isScreen = (object.userData.type === 'screen');
    if (isScreen) {
      needsConfigChange = true;
      // apply new width / height to camera props

      let width = screenWidth.getValue();
      let height = screenHeight.getValue();

      if (uiInput === screenWidth) {
        const aspect = object.userData.camera.size.width / object.userData.camera.size.height;
        height = width / aspect;
      } else if (uiInput === screenHeight) {
        const aspect = object.userData.camera.size.height / object.userData.camera.size.width;
        width = height / aspect;
      }

      object.userData.camera.size.width = width;
      object.userData.camera.size.height = height;

      const newSize = { width: width, height: height };
      const bounds = getBoundsForSize(newSize);
      
      editor.execute( new SetValueCommand( editor, object, 'left', bounds.left ) );
      editor.execute( new SetValueCommand( editor, object, 'right', bounds.right ) );
      editor.execute( new SetValueCommand( editor, object, 'top', bounds.top ) );
      editor.execute( new SetValueCommand( editor, object, 'bottom', bounds.bottom ) );
      // object.updateProjectionMatrix();
    }

    if ( needsConfigChange ) {
      if (object.userData.onChange) {
        object.userData.onChange();
      }
    }
  }

  function updateUI( object ) {
    if (object.userData.id) {
      objectId.setValue(object.userData.id);
    }
    objectPositionX.setValue( object.position.x );
    objectPositionY.setValue( object.position.y );
    objectPositionZ.setValue( object.position.z );

    const isScreen = (object.userData.type === 'screen');

    if (isScreen) {
      screenWidth.setValue(object.userData.camera.size.width);
      screenHeight.setValue(object.userData.camera.size.height);
    }
  }

  signals.objectSelected.add( function ( object ) {

    if ( object !== null ) {

      container.setDisplay( 'block' );

      updateUI(object);

    } else {

      container.setDisplay( 'none' );

    }

  } );

  signals.objectChanged.add( function ( object ) {

    if ( object !== editor.selected ) return;

    updateUI( object );

  } );

  signals.refreshSidebarObject3D.add( function ( object ) {

    if ( object !== editor.selected ) return

    updateUI( object );

  } );

  return container;

}

export { SidebarObject };