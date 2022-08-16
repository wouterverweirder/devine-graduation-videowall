import * as THREE from '../../../three.js/build/three.module.js';

class SceneObject {

  customData = {};

  constructor(id = THREE.MathUtils.generateUUID(), props = {}) {
    const mergedProps = {
      name: 'sceneObject',
      position: {
        x: 0,
        y: 0,
        z: 0
      }
    };
    Object.assign(mergedProps, props);
    props = mergedProps;
    this.id = id;
    this.type = 'sceneObject';
    this.props = props;
    this.signals = {};
    const Signal = window.signals.Signal;
    this.signals.onPropsApplied = new Signal();
  }

  async init() {
    this._object3D = await this.createObject3D();
    this.object3D.userData.sceneObject = this;

    this.applyProps(this.props);
  }

  async createObject3D() {
    throw new Error("createObject3D not implemented");
  }

  get object3D() {
    return this._object3D;
  }

  applyProps(newProps) {
    if (newProps.position) {
      Object.assign(this.props.position, newProps.position);
      this.object3D.position.x = this.props.position.x;
      this.object3D.position.y = this.props.position.y;
      this.object3D.position.z = this.props.position.z;
    }
    if (newProps.rotation) {
      Object.assign(this.props.rotation, newProps.rotation);
      this.object3D.rotation.x = this.props.rotation.x;
      this.object3D.rotation.y = this.props.rotation.y;
      this.object3D.rotation.z = this.props.rotation.z;
    }
    if (newProps.scale) {
      Object.assign(this.props.scale, newProps.scale);
      this.object3D.scale.x = this.props.scale.x;
      this.object3D.scale.y = this.props.scale.y;
    }
    if (newProps.anchor) {
      Object.assign(this.props.anchor, newProps.anchor);
    }
    if (newProps.fixedRepeat) {
      Object.assign(this.props.fixedRepeat, newProps.fixedRepeat);
    }
    if (newProps.roles) {
      Object.assign(this.props.roles, newProps.roles);
    }
    if (newProps.layers !== undefined) {
      if (newProps.layers.length) {
        this.props.layers = [...newProps.layers];
      } else {
        this.props.layers = newProps.layers;
      }
      if (this.props.layers === false) {
        this.object3D.layers.enableAll();
      } else {
        this.object3D.layers.disableAll();
        this.props.layers.forEach(layer => this.object3D.layers.enable(layer));
      }
    }
    if (newProps.name) {
      this.props.name = newProps.name;
      this.object3D.name = this.props.name;
    }
    this.signals.onPropsApplied.dispatch();
  }

  render() {
  }

  dispose() {
  }
}

export { SceneObject };