import * as THREE from '../../three.js/build/three.module.js';
import { UIPanel, UIRow, UIText, UINumber, UIBreak } from '../../three.js/editor/js/libs/ui.js';
import { SetValueCommand } from '../../three.js/editor/js/commands/SetValueCommand.js';
import { getBoundsForSize, getSizeForBounds } from '../../functions/screenUtils.js';
import { SetScaleCommand } from '../../three.js/editor/js/commands/SetScaleCommand.js';
import { SetPositionCommand } from '../../three.js/editor/js/commands/SetPositionCommand.js';
import { UICheckboxList } from './UICheckboxList.js';
import { ScreenRole } from '../../consts/ScreenRole.js';

function SidebarObject( editor ) {

  const signals = editor.signals;
  const serverConnection = editor.serverConnection;

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

  const screenRolesRow = new UIRow();
  screenRolesRow.add( new UIText( 'Roles' ).setWidth( '90px' ) );
  const screenRolesList = new UICheckboxList().onChange( () => update(screenRolesList));

  screenRolesList.setItems([
    { id: ScreenRole.MAIN_VIDEO, name: 'main video' },
    { id: ScreenRole.PROFILE_PICTURE, name: 'profile picture' },
    { id: ScreenRole.PROJECT_BIO, name: 'project bio' },
    { id: ScreenRole.PROJECT_DESCRIPTION, name: 'project description' },
    { id: ScreenRole.PORTRAIT_SCREENSHOTS, name: 'portrait screenshots' },
    { id: ScreenRole.LANDSCAPE_SCREENSHOTS, name: 'landscape screenshots' },
    { id: ScreenRole.VIDEOS, name: 'videos' }
  ]);
  screenRolesRow.add(screenRolesList);
  container.add( screenRolesRow );

  const planeSizeRow = new UIRow();
  const planeWidth = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( () => update(planeWidth) );
  const planeHeight = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( () => update(planeHeight) );
  planeSizeRow.add( new UIText( 'Size' ).setWidth( '90px' ) );
  planeSizeRow.add( planeWidth, planeHeight );
  container.add( planeSizeRow );

  function update(uiInput = null) {

    const object = editor.selected;

    if ( object === null || !object.userData.sceneObject) {
      // don't do anything when no object is selected
      return;
    }

    const sceneObject = object.userData.sceneObject;

    let needsConfigChange = false;

    let hasNewObjectProps = false;
    const newObjectProps = {
      id: sceneObject.id,
      props: {}
    }

    const newPosition = new THREE.Vector3( objectPositionX.getValue(), objectPositionY.getValue(), objectPositionZ.getValue() );
    if ( object.position.distanceTo( newPosition ) >= 0.01 ) {
      editor.execute( new SetPositionCommand(editor, object, newPosition ));
      needsConfigChange = true;
      hasNewObjectProps = true;
      newObjectProps.props.position = {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z
      };
    }

    const isScreen = (sceneObject.type === 'camera');
    const isPlane = (!isScreen);

    if (isScreen) {
      needsConfigChange = true;
      // apply new width / height to camera props

      let width = screenWidth.getValue();
      let height = screenHeight.getValue();

      const size = getSizeForBounds(object);

      if (uiInput === screenWidth) {
        const aspect = size.width / size.height;
        height = width / aspect;
      } else if (uiInput === screenHeight) {
        const aspect = size.height / size.width;
        width = height / aspect;
      }

      screenWidth.setValue(width);
      screenHeight.setValue(height);

      const newSize = { width: width, height: height };
      const bounds = getBoundsForSize(newSize);
      
      editor.execute( new SetValueCommand( editor, object, 'left', bounds.left ) );
      editor.execute( new SetValueCommand( editor, object, 'right', bounds.right ) );
      editor.execute( new SetValueCommand( editor, object, 'top', bounds.top ) );
      editor.execute( new SetValueCommand( editor, object, 'bottom', bounds.bottom ) );

      hasNewObjectProps = true;
      newObjectProps.props.left = bounds.left;
      newObjectProps.props.right = bounds.right;
      newObjectProps.props.top = bounds.top;
      newObjectProps.props.bottom = bounds.bottom;

      // update the roles
      newObjectProps.props.roles = screenRolesList.getValue();
    }
    if (isPlane) {

      const newScale = new THREE.Vector3( planeWidth.getValue(), planeHeight.getValue(), 1 );
			if ( object.scale.distanceTo( newScale ) >= 0.01 ) {
        needsConfigChange = true;

        editor.execute( new SetScaleCommand( editor, object, newScale ));

        hasNewObjectProps = true;
        newObjectProps.props.scale = {
          x: newScale.x,
          y: newScale.y,
          z: newScale.z
        }
			}
    }

    if ( hasNewObjectProps ) {
      serverConnection.requestSetObjectProps(newObjectProps);
    }
  }

  function updateRows( object ) {

    if ( !object.userData.sceneObject) {
      return;
    }

    const sceneObject = object.userData.sceneObject;

    objectIdRow.setDisplay((sceneObject.id) ? '' : 'none' );

    const isScreen = (sceneObject.type === 'camera');
    screenSizeRow.setDisplay(isScreen ? '' : 'none');
    screenRolesRow.setDisplay(isScreen ? '' : 'none');

    const isPlane = (!isScreen);
    planeSizeRow.setDisplay(isPlane ? '' : 'none');
  }

  function updateUI( object ) {
    if ( !object.userData.sceneObject) {
      return;
    }

    const sceneObject = object.userData.sceneObject;

    objectId.setValue(sceneObject.id);

    objectPositionX.setValue( object.position.x );
    objectPositionY.setValue( object.position.y );
    objectPositionZ.setValue( object.position.z );

    const isScreen = (sceneObject.type === 'camera');
    const isPlane = (!isScreen);

    if (isScreen) {
      const size = getSizeForBounds(object);
      screenWidth.setValue(size.width);
      screenHeight.setValue(size.height);

      screenRolesList.setValue(sceneObject.props.roles);
    }
    if (isPlane) {
      planeWidth.setValue(object.scale.x);
      planeHeight.setValue(object.scale.y);
    }
  }

  signals.objectSelected.add( function ( object ) {

    if ( object !== null ) {

      container.setDisplay( 'block' );

      updateRows( object );
      updateUI( object );

    } else {

      container.setDisplay( 'none' );

    }

  } );

  signals.refreshSidebarObject3D.add( function ( object ) {
    // triggered from interactions in the editor viewport

    if ( object !== editor.selected ) return

    // sync through serverConnection
    if (object.userData.sceneObject) {
      const sceneObject = object.userData.sceneObject;
      const newObjectProps = {
        id: sceneObject.id,
        props: {
          position: {
            x: object.position.x,
            y: object.position.y,
            z: object.position.z,
          }
        }
      };
      serverConnection.requestSetObjectProps(newObjectProps);
    }

    // update the user interface
    updateUI(object);

  } );

  return container;

}

export { SidebarObject };