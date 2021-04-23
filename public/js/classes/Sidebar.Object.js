import * as THREE from '../three.js/build/three.module.js';
import { UIPanel, UIRow, UIText, UINumber, UIBreak, UIButton } from '../three.js/editor/js/libs/ui.js';
import { UIOutliner, UITexture } from '../three.js/editor/js/libs/ui.three.js';
import { SetPositionCommand } from '../three.js/editor/js/commands/SetPositionCommand.js';

function SidebarObject( editor ) {

  var signals = editor.signals;

  var container = new UIPanel();
  container.setDisplay( 'none' );

  var objectIdRow = new UIRow();
  var objectId = new UIText();
  objectIdRow.add( new UIText( 'Id' ).setWidth( '90px' ) );
  objectIdRow.add( objectId );
  container.add( objectIdRow );

  var objectPositionRow = new UIRow();
  var objectPositionX = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( update );
  var objectPositionY = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( update );
  var objectPositionZ = new UINumber().setPrecision( 3 ).setWidth( '50px' ).onChange( update );
  objectPositionRow.add( new UIText( 'Position' ).setWidth( '90px' ) );
  objectPositionRow.add( objectPositionX, objectPositionY, objectPositionZ );
  container.add( objectPositionRow );

  container.add( new UIBreak() );

  // var outliner = new UIOutliner( editor );
  // outliner.setId( 'outliner' );
  // outliner.onChange( function () {
  //   console.log(outliner.getValue());
  // } );
  // outliner.onDblClick( function () {
  // } );
  // container.add( outliner );

  // container.add( new UIBreak() );

  // var newPlaneRow = new UIRow();
  // var newPlaneButton = new UIButton().setLabel('New Plane');
  // newPlaneButton.onClick(() => {
  //   console.log('new plane');
  // });
  // newPlaneRow.add(newPlaneButton);
  // container.add(newPlaneRow);

  function update() {

    var object = editor.selected;

    if ( object !== null ) {
      var newPosition = new THREE.Vector3( objectPositionX.getValue(), objectPositionY.getValue(), objectPositionZ.getValue() );
      if ( object.position.distanceTo( newPosition ) >= 0.01 ) {

        editor.execute( new SetPositionCommand( editor, object, newPosition ) );

      }

      editor.signals.configChanged.dispatch();
    }
  }

  function updateUI( object ) {
    if (object.userData.id) {
      objectId.setValue(object.userData.id);
    }
    objectPositionX.setValue( object.position.x );
    objectPositionY.setValue( object.position.y );
    objectPositionZ.setValue( object.position.z );

    var options = [];

    // if (object.userData.planes) {
    //   object.userData.planes.forEach(planeConfig => {

    //     var option = document.createElement( 'div' );
    //     option.style.display = 'flex';
    //     option.style.alignItems = 'center';
    //     option.draggable = false;

    //     var html = `<span class="type"></span> <span>${planeConfig.url ? planeConfig.url : planeConfig.id}</span>`;
    //     html += `<button style="margin-left: auto;">remove</button>`;
    //     option.innerHTML = html;
    //     option.value = planeConfig.id;

    //     var removeButton = option.querySelector('button');
    //     removeButton.addEventListener('click', () => {
    //       editor.signals.requestRemovePlaneFromScreen.dispatch(planeConfig);
    //     });

    //     options.push( option );
    //   });
    // }

    // outliner.setOptions(options);
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

    if ( object !== editor.selected ) return;

    updateUI( object );

  } );

  return container;

}

export { SidebarObject };