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
    'image': 'Image'
  });
  typeSelect.setValue( 'image' );
  typeRow.add(typeSelect);
  container.add(typeRow);

  const imageRow = new UIRow();
  imageRow.add( new UIText( 'Image' ).setWidth( '90px' ) );
  const imageSelect = new UISelect();
  imageRow.add(imageSelect);
  container.add(imageRow);

  const newPlaneRow = new UIRow();
  newPlaneRow.add( new UIText( '' ).setWidth( '90px' ) );
  const newPlaneButton = new UIButton().setLabel('Create New Plane');
  newPlaneRow.add(newPlaneButton);
  container.add(newPlaneRow);

  let firstScreen;
  let images = [];
  let firstImage;
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
  };

  const fetchImageList = async () => {
    const data = await (await fetch(`http://${serverAddress}/api/images`)).json();
    images = data.data;
    refreshUI();
  };

  refreshUI();
  fetchImageList();

  signals.editorCleared.add( refreshUI );
  signals.sceneGraphChanged.add( refreshUI );

  newPlaneButton.onClick(() => {
    const createOptions = {
      id: THREE.MathUtils.generateUUID(),
      screenId: locationSelect.getValue(),
      type: typeSelect.getValue(),
      url: imageSelect.getValue()
    };
    serverConnection.requestCreatePlaneOnScreen(createOptions);
  });

  return container;

}

export { SidebarNew };