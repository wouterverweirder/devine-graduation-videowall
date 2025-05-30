import EventEmitter from 'eventemitter3';
import { SceneObjectConfigScreen, ScreenConfig } from '../../../types';
import * as THREE from 'three';

export type SceneObjectProps = {
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
  };
  anchor: {
    x: number;
    y: number;
  };
  fixedRepeat: {
    x: number;
    y: number;
  };
  roles: string[];
  layers: number[] | boolean;
  screenConfig?: ScreenConfig; // Configuration for the screen this object is associated with
  appConfig: object; // Application-specific configuration
  [key: string]: unknown; // Allow additional properties
};

export type OptionalSceneObjectProps = {
  [K in keyof SceneObjectProps]?: SceneObjectProps[K];
} & {
  [key: string]: unknown; // Allow additional properties
};

export type CustomData = {
  [key: string]: unknown; // Custom data can be anything, so we use a generic object type
  screenConfig?: ScreenConfig; // Optional screen configuration
  sliderScreen?: SceneObjectConfigScreen;
}

class SceneObject {

  id: string;
  type: string;
  props: SceneObjectProps;
  events = {
    onPropsApplied: new EventEmitter()
  };
  _object3D: THREE.Object3D;

  disposed = false;
  customData:CustomData = {};

  constructor(id = THREE.MathUtils.generateUUID(), props:OptionalSceneObjectProps = {}) {
    const mergedProps:SceneObjectProps = {
      name: 'sceneObject',
      position: {
        x: 0,
        y: 0,
        z: 0
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      scale: {
        x: 1,
        y: 1
      },
      anchor: {
        x: 0.5,
        y: 0.5
      },
      fixedRepeat: {
        x: 1,
        y: 1
      },
      roles: [],
      layers: false,
      appConfig: {},
      ...props
    };
    this.id = id;
    this.type = 'sceneObject';
    this.props = mergedProps;
  }

  async init() {
    this._object3D = await this.createObject3D();
    this.object3D.userData.sceneObject = this;

    this.applyProps(this.props);
  }

  async createObject3D(): Promise<THREE.Object3D> {
    throw new Error("createObject3D not implemented");
  }

  get object3D() {
    return this._object3D;
  }

  applyProps(newProps:OptionalSceneObjectProps) {
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
      if (Array.isArray(newProps.layers)) {
        this.props.layers = [...newProps.layers];
      } else {
        this.props.layers = newProps.layers;
      }
      if (this.props.layers === false) {
        this.object3D.layers.enableAll();
      } else if (Array.isArray(this.props.layers)) {
        this.object3D.layers.disableAll();
        this.props.layers.forEach(layer => this.object3D.layers.enable(layer));
      }
    }
    if (newProps.name) {
      this.props.name = newProps.name;
      this.object3D.name = this.props.name;
    }
    this.events.onPropsApplied.emit('onPropsApplied');
  }

  render() {
  }

  dispose() {
    this.disposed = true;
  }
}

export { SceneObject };
