import * as THREE from '../three.js/build/three.module.js';

import { UITabbedPanel, UISpan, UIPanel, UIRow, UIText, UINumber } from '../three.js/editor/js/libs/ui.js';
import { SetPositionCommand } from '../three.js/editor/js/commands/SetPositionCommand.js';

class Sidebar {

  constructor(editor) {
    var strings = editor.strings;

    const container = new UITabbedPanel();
    container.setId( 'sidebar' );

    const propsTab = new UISpan().add(
      new SidebarObject( editor )
    );

    container.addTab( 'propsTab', 'Properties', propsTab );
    container.select( 'propsTab' );

    this.dom = container.dom;
  }

}

function SidebarObject( editor ) {

  var strings = editor.strings;

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

export { Sidebar };