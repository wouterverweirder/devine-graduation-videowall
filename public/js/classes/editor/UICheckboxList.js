import { UIElement } from '../../three.js/editor/js/libs/ui.js';

// UICheckboxList
function UICheckboxList( ) {

  UIElement.call( this );

  var dom = document.createElement( 'div' );
  dom.className = 'CheckboxList';
  dom.tabIndex = 0;

  this.dom = dom;
  this.items = [];
  this.listitems = [];
  this.selectedItems = [];

  return this;

}

UICheckboxList.prototype = Object.create( UIElement.prototype );
UICheckboxList.prototype.constructor = UICheckboxList;

UICheckboxList.prototype.setItems = function ( items ) {

  if ( Array.isArray( items ) ) {

    this.items = items;

  }

  this.render();

};

UICheckboxList.prototype.render = function ( ) {

  while ( this.listitems.length ) {

    var item = this.listitems[ 0 ];

    item.dom.remove();

    this.listitems.splice( 0, 1 );

  }

  for ( var i = 0; i < this.items.length; i ++ ) {

    var item = this.items[ i ];

    var listitem = new UICheckboxList.Checkbox( this );
    listitem.setId( item.id || `Listbox-${i}` );
    listitem.setTextContent( item.name || item.type );
    this.add( listitem );

  }

};

// Assuming user passes valid list items
UICheckboxList.prototype.add = function () {

  var items = Array.from( arguments );

  this.listitems = this.listitems.concat( items );

  UIElement.prototype.add.apply( this, items );

};

UICheckboxList.prototype.getValue = function () {

	return this.selectedItems;

};

UICheckboxList.prototype.setValue = function ( value ) {

  for ( var i = 0; i < this.listitems.length; i ++ ) {

    var element = this.listitems[ i ];

    if ( value.includes(element.getId()) ) {

      element.setValue( true );

    } else {

      element.setValue( false );

    }

  }

  this.selectedItems = value;

  var changeEvent = document.createEvent( 'HTMLEvents' );
  changeEvent.initEvent( 'change', true, true );
  this.dom.dispatchEvent( changeEvent );

};

UICheckboxList.prototype.handleInputChanged = function ( checkbox ) {
  const newValue = [];
  this.items.forEach((item, index) => {
    const listitem = this.listitems[index];
    if (listitem.getValue()) {
      newValue.push(listitem.getId());
    }
  });
  this.setValue(newValue);
};

// Listbox Item
UICheckboxList.Checkbox = function ( parent ) {

  UIElement.call( this );

  var dom = document.createElement( 'div' );
  dom.className = 'Checkbox';

  var label = document.createElement( 'label' );
  dom.appendChild(label);

  var input = document.createElement( 'input' );
  input.setAttribute('type', 'checkbox');
  label.appendChild(input);

  var labelContent = document.createElement('span');
  label.appendChild(labelContent);

  this.parent = parent;
  this.dom = dom;
  this.input = input;
  this.labelContent = labelContent;

  var scope = this;

  input.addEventListener('change', function() {
    if (scope.parent) {
      scope.parent.handleInputChanged(scope)
    }
  }, false);

  return this;

};

UICheckboxList.Checkbox.prototype = Object.create( UIElement.prototype );
UICheckboxList.Checkbox.prototype.constructor = UICheckboxList.Checkbox;

UICheckboxList.Checkbox.prototype.getValue = function () {

  return this.input.checked;

};

UICheckboxList.Checkbox.prototype.setValue = function ( value ) {

  if ( value !== undefined ) {

    this.input.checked = value;

  }

  return this;

};

UICheckboxList.Checkbox.prototype.setTextContent = function ( value ) {

  this.labelContent.textContent = value;

  return this;

}

export { UICheckboxList }