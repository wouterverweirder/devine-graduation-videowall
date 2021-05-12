import { UIPanel, UIBreak, UIRow, UIButton, UISelect, UIText } from '../../three.js/editor/js/libs/ui.js';
import { UIOutliner } from '../../three.js/editor/js/libs/ui.three.js';

function SidebarScene( editor ) {

	var signals = editor.signals;
	const serverConnection = editor.serverConnection;

	const serverAddress = editor.config.getKey('serverAddress');

	var container = new UIPanel();
	container.setBorderTop( '0' );
	container.setPaddingTop( '20px' );

	// outliner

	var nodeStates = new WeakMap();

	function buildOption( object, draggable ) {

		var option = document.createElement( 'div' );
		option.draggable = draggable;
		option.innerHTML = buildHTML( object );
		option.value = object.id;

		// opener

		if ( nodeStates.has( object ) ) {

			var state = nodeStates.get( object );

			var opener = document.createElement( 'span' );
			opener.classList.add( 'opener' );

			if ( object.children.length > 0 ) {

				opener.classList.add( state ? 'open' : 'closed' );

			}

			opener.addEventListener( 'click', function () {

				nodeStates.set( object, nodeStates.get( object ) === false ); // toggle
				refreshUI();

			}, false );

			option.insertBefore( opener, option.firstChild );

		}

		return option;

	}

	function getMaterialName( material ) {

		if ( Array.isArray( material ) ) {

			var array = [];

			for ( var i = 0; i < material.length; i ++ ) {

				array.push( material[ i ].name );

			}

			return array.join( ',' );

		}

		return material.name;

	}

	function escapeHTML( html ) {

		return html
			.replace( /&/g, '&amp;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#39;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );

	}

	function getObjectType( object ) {

		if ( object.isScene ) return 'Scene';
		if ( object.isCamera ) return 'Camera';
		if ( object.isLight ) return 'Light';
		if ( object.isMesh ) return 'Mesh';
		if ( object.isLine ) return 'Line';
		if ( object.isPoints ) return 'Points';

		return 'Object3D';

	}

	function buildHTML( object ) {

		var html = `<span class="type ${ getObjectType( object ) }"></span> ${ escapeHTML( object.name ) }`;

		if ( object.isMesh ) {

			var geometry = object.geometry;
			var material = object.material;

			html += ` <span class="type Geometry"></span> ${ escapeHTML( geometry.name ) }`;
			html += ` <span class="type Material"></span> ${ escapeHTML( getMaterialName( material ) ) }`;

		}

		html += getScript( object.uuid );

		return html;

	}

	function getScript( uuid ) {

		if ( editor.scripts[ uuid ] !== undefined ) {

			return ' <span class="type Script"></span>';

		}

		return '';

	}

	var ignoreObjectSelectedSignal = false;

	var outliner = new UIOutliner( editor );
	outliner.dom.classList.add('Outliner--scene');
	outliner.setId( 'outliner' );
	outliner.onChange( function () {

		ignoreObjectSelectedSignal = true;

		editor.selectById( parseInt( outliner.getValue() ) );

		ignoreObjectSelectedSignal = false;

	} );
	outliner.onDblClick( function () {

		editor.focusById( parseInt( outliner.getValue() ) );

	} );
	container.add( outliner );
	container.add( new UIBreak() );

	const projectRow = new UIRow();
  projectRow.add( new UIText( 'Project' ).setWidth( '90px' ) );
  const projectSelect = new UISelect();
  projectRow.add(projectSelect);
  container.add(projectRow);

	const showProjectButtonRow = new UIRow();
	const showProjectButton = new UIButton().setLabel('Show Project').onClick(() => {
		const project = getSelectedProject();
		serverConnection.requestShowProject(project);
	});
  showProjectButtonRow.add(showProjectButton);
	container.add(showProjectButtonRow);

	const showOverviewButtonRow = new UIRow();
	const showOverviewButton = new UIButton().setLabel('Show Overview').onClick(() => {
		serverConnection.requestShowProjectsOverview();
	});
  showOverviewButtonRow.add(showOverviewButton);
	container.add(showOverviewButtonRow);

	const clearSceneButtonRow = new UIRow();
	const clearSceneButton = new UIButton().setLabel('Clear Scene').onClick(() => {
		serverConnection.requestClearScene();
	});
  clearSceneButtonRow.add(clearSceneButton);
	container.add(clearSceneButtonRow);

	const dvdButtonRow = new UIRow();
	const dvdButton = new UIButton().setLabel('DVD').onClick(() => {
		serverConnection.requestShowBouncingDVDLogo();
	});
  dvdButtonRow.add(dvdButton);
	container.add(dvdButtonRow);

	// navigate betweeon project details and overview
	//

	let projects = [];
	let firstProject;

	function refreshUI() {

		var camera = editor.camera;
		var scene = editor.scene;

		var options = [];

		// options.push( buildOption( camera, false ) );
		options.push( buildOption( scene, false ) );

		( function addObjects( objects, pad ) {

			for ( var i = 0, l = objects.length; i < l; i ++ ) {

				var object = objects[ i ];

				if ( nodeStates.has( object ) === false ) {

					nodeStates.set( object, false );

				}

				var option = buildOption( object, true );
				option.style.paddingLeft = ( pad * 18 ) + 'px';
				options.push( option );

				if ( nodeStates.get( object ) === true ) {

					addObjects( object.children, pad + 1 );

				}

			}

		} )( scene.children, 0 );

		outliner.setOptions( options );

		if ( editor.selected !== null ) {

			outliner.setValue( editor.selected.id );

		}

		const projectOptions = {};
    projects.forEach((project) => {
      projectOptions[project.id] = `${project.firstName} ${project.lastName}`;
    })
    projectSelect.setOptions(projectOptions);
		if (!firstProject && projects.length > 0) {
      firstProject = projects[0];
      projectSelect.setValue(firstProject.id);
    }

	}

	const getSelectedProject = () => {
    const projectId = parseInt(projectSelect.getValue());
    return projects.find(project => project.id === projectId);
  };

	refreshUI();

	// events

	signals.editorCleared.add( refreshUI );

	signals.sceneGraphChanged.add( refreshUI );

	/*
	signals.objectChanged.add( function ( object ) {

		var options = outliner.options;

		for ( var i = 0; i < options.length; i ++ ) {

			var option = options[ i ];

			if ( option.value === object.id ) {

				option.innerHTML = buildHTML( object );
				return;

			}

		}

	} );
	*/

	signals.objectSelected.add( function ( object ) {

		if ( ignoreObjectSelectedSignal === true ) return;

		if ( object !== null ) {

			let needsRefresh = false;
			let parent = object.parent;

			while ( parent !== editor.scene ) {

				if ( nodeStates.get( parent ) !== true ) {

					nodeStates.set( parent, true );
					needsRefresh = true;

				}

				parent = parent.parent;

			}

			if ( needsRefresh ) refreshUI();

			outliner.setValue( object.id );

		} else {

			outliner.setValue( null );

		}

	} );

	const fetchProjectsList = async () => {
    const data = await (await fetch(`http://${serverAddress}/api/projects`)).json();
    projects = data.data;
  };

	fetchProjectsList()
		.then(() => refreshUI());

	return container;

}

export { SidebarScene };
