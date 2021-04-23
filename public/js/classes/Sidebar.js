import { UITabbedPanel, UISpan } from '../three.js/editor/js/libs/ui.js';
import { SidebarScene } from './Sidebar.Scene.js';
import { SidebarObject } from './Sidebar.Object.js';
import { SidebarNew } from './Sidebar.New.js';

class Sidebar {

  constructor(editor) {

    const container = new UITabbedPanel();
    container.setId( 'sidebar' );

    const sceneTab = new UISpan().add(
      new SidebarScene( editor ),
      new SidebarObject( editor )
    );
    container.addTab( 'sceneTab', 'Scene', sceneTab );

    const newTab = new UISpan().add(
      new SidebarNew( editor )
    );
    container.addTab( 'newTab', 'New', newTab );

    container.select( 'sceneTab' );

    this.dom = container.dom;
  }

}

export { Sidebar };