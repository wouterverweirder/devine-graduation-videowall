import * as THREE from '../../three.js/build/three.module.js';
import { UIPanel, UIRow, UIText, UIButton, UISelect, UIListbox } from '../../three.js/editor/js/libs/ui.js';
import { UICheckboxList } from './UICheckboxList.js';
import { PlaneType } from '../../consts/PlaneType.js';

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
    'project-description': 'Project Description',
    'profile-picture': 'Project Student',
    'project-assets': 'Project Assets'
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
  const projectSelect = new UISelect().onChange(() => updateProjectAssetsList());
  projectRow.add(projectSelect);
  container.add(projectRow);

  const projectAssetsRow = new UIRow();
  projectAssetsRow.add( new UIText( 'Assets' ).setWidth( '90px' ) );
  const projectAssetsList = new UICheckboxList();
  projectAssetsRow.add(projectAssetsList);
  container.add(projectAssetsRow);

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
    const screens = scene.children.filter(child => child.userData.sceneObject && child.userData.sceneObject.type === 'camera');
    
    const screenOptions = {};
    screens.forEach(screen => {
      screenOptions[screen.userData.sceneObject.id] = screen.name;
    });
    locationSelect.setOptions(screenOptions);
    if (!firstScreen && screens.length > 0) {
      firstScreen = screens[0];
      locationSelect.setValue(firstScreen.userData.sceneObject.id);
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
    projects.forEach((project) => {
      projectOptions[project.id] = `${project.firstName} ${project.lastName}`;
    })
    projectSelect.setOptions(projectOptions);
    if (!firstProject && projects.length > 0) {
      firstProject = projects[0];
      projectSelect.setValue(firstProject.id);
      updateProjectAssetsList();
    }

    const imageSelectVisible = (typeSelect.getValue() === 'image');

    imageRow.setDisplay((imageSelectVisible) ? '' : 'none' );
    projectRow.setDisplay(shouldProjectSelectBeVisible() ? '' : 'none' );
    projectAssetsRow.setDisplay(shouldProjectAssetsListBeVisible() ? '' : 'none' );

  };

  const updateProjectAssetsList = () => {
    const project = getSelectedProject();
    const items = [];
    items.push({
      id: project.mainAsset.id,
      name: new URL(project.mainAsset.url).pathname
    });
    project.assets.forEach(asset => {
      items.push({
        id: asset.id,
        name: new URL(asset.url).pathname
      });
    });
    projectAssetsList.setItems(items);
  };

  const getSelectedProject = () => {
    const projectId = parseInt(projectSelect.getValue());
    return projects.find(project => project.id === projectId);
  };

  const getSelectedProjectAssets = () => {
    const projectAssetsListValue = projectAssetsList.getValue().map(id => parseInt(id));
    const project = getSelectedProject();
    const selectedProjectAssets = project.assets.filter(asset => projectAssetsListValue.includes(asset.id));
    if (projectAssetsListValue.includes(project.mainAsset.id)) {
      selectedProjectAssets.unshift(project.mainAsset);
    }
    return selectedProjectAssets;
  };

  const shouldProjectSelectBeVisible = () => {
    const projectTypes = ['project-description', 'profile-picture', 'project-assets'];
    return projectTypes.includes(typeSelect.getValue());
  };

  const shouldProjectAssetsListBeVisible = () => {
    const projectAssetsTypes = ['project-assets'];
    return projectAssetsTypes.includes(typeSelect.getValue());
  };

  const fetchImageList = async () => {
    const data = await (await fetch(`http://${serverAddress}/api/images`)).json();
    images = data.data;
  };

  const fetchProjectsList = async () => {
    const data = await (await fetch(`http://${serverAddress}/api/projects`)).json();
    projects = data.data;
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
    } else if (shouldProjectSelectBeVisible()) {
      createOptions.data = getSelectedProject();
      if (typeSelect.getValue() === 'project-assets') {
        createOptions.data = getSelectedProjectAssets();
      }
    }
    serverConnection.requestCreatePlaneOnScreen(createOptions);
  });

  return container;

}

export { SidebarNew };