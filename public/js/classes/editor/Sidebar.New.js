import * as THREE from '../../three.js/build/three.module.js';
import { UIPanel, UIRow, UIText, UIButton, UISelect } from '../../three.js/editor/js/libs/ui.js';

function SidebarNew( editor ) {

  const signals = editor.signals;
  const serverConnection = editor.serverConnection;

  const serverAddress = editor.config.getKey('serverAddress');

  const container = new UIPanel();

  const locationRow = new UIRow();
  locationRow.add( new UIText( 'Location' ).setWidth( '90px' ) );
  const locationSelect = new UISelect();
  locationRow.add(locationSelect);
  container.add(locationRow);

  const typeRow = new UIRow();
  typeRow.add( new UIText( 'Type' ).setWidth( '90px' ) );
  const typeSelect = new UISelect().setOptions({
    'image': 'Image',
    'project-description': 'Project Description'
  }).onChange(() => refreshUI());
  typeSelect.setValue( 'image' );
  typeRow.add(typeSelect);
  container.add(typeRow);

  const imageRow = new UIRow();
  imageRow.add( new UIText( 'Image' ).setWidth( '90px' ) );
  const imageSelect = new UISelect();
  imageRow.add(imageSelect);
  container.add(imageRow);

  const projectRow = new UIRow();
  projectRow.add( new UIText( 'Project' ).setWidth( '90px' ) );
  const projectSelect = new UISelect();
  projectRow.add(projectSelect);
  container.add(projectRow);

  const newPlaneRow = new UIRow();
  newPlaneRow.add( new UIText( '' ).setWidth( '90px' ) );
  const newPlaneButton = new UIButton().setLabel('Create New Plane');
  newPlaneRow.add(newPlaneButton);
  container.add(newPlaneRow);

  let firstScreen;
  let images = [];
  let firstImage;
  let projects = [];
  let firstProject;
  const refreshUI = () => {
    const scene = editor.scene;
    const screens = scene.children.filter(child => child.userData.type && child.userData.type === 'screen');
    
    const screenOptions = {};
    screens.forEach(screen => {
      screenOptions[screen.userData.id] = screen.name;
    });
    locationSelect.setOptions(screenOptions);
    if (!firstScreen && screens.length > 0) {
      firstScreen = screens[0];
      locationSelect.setValue(firstScreen.userData.id);
    }

    const imageOptions = {};
    images.forEach(image => {
      const url = new URL(image);
      imageOptions[image] = url.pathname;
    })
    imageSelect.setOptions(imageOptions);
    if (!firstImage && images.length > 0) {
      firstImage = images[0];
      imageSelect.setValue(firstImage);
    }

    const projectOptions = {};
    projects.forEach((project, index) => {
      projectOptions[index] = `${project.student.firstName} ${project.student.lastName}`;
    })
    projectSelect.setOptions(projectOptions);
    if (!firstProject && projects.length > 0) {
      firstProject = projects[0];
      projectSelect.setValue(0);
    }

    const imageSelectVisible = (typeSelect.getValue() === 'image');
    const projectSelectVisible = (typeSelect.getValue() === 'project-description');

    imageRow.setDisplay((imageSelectVisible) ? '' : 'none' );
    projectRow.setDisplay((projectSelectVisible) ? '' : 'none' );

  };

  const fetchImageList = async () => {
    const data = await (await fetch(`http://${serverAddress}/api/images`)).json();
    images = data.data;
  };

  const fetchProjectsList = async () => {
    const data = await (await fetch(`http://${serverAddress}/api/projects`)).json();
    projects = data.data.projects;
  };

  refreshUI();
  fetchImageList()
    .then(() => fetchProjectsList())
    .then(() => refreshUI());

  signals.editorCleared.add( refreshUI );
  signals.sceneGraphChanged.add( refreshUI );

  newPlaneButton.onClick(() => {
    const createOptions = {
      id: THREE.MathUtils.generateUUID(),
      screenId: locationSelect.getValue(),
      type: typeSelect.getValue()
    };
    // url: imageSelect.getValue()
    if (typeSelect.getValue() === 'image') {
      createOptions.url = imageSelect.getValue();
    } else if (typeSelect.getValue() === 'project-description') {
      createOptions.data = projects[projectSelect.getValue()];
    }
    serverConnection.requestCreatePlaneOnScreen(createOptions);
  });

  return container;

}

export { SidebarNew };