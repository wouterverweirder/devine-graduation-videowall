import { UITabbedPanel, UISpan } from '../three.js/editor/js/libs/ui.js';
import { SidebarObject } from './Sidebar.Object.js';

class Sidebar {

  constructor(editor) {

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

export { Sidebar };