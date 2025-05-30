import * as THREE from 'three';
import { getValueByPath } from '../../functions/getValueByPath';
import { ApplicationConfig, FetchProjectsResult, SceneConfig, ScreenConfig } from '../../types';
import { SceneObject } from './objects/SceneObject';
import { ScreenCamera } from './objects/ScreenCamera';
import EventEmitter from 'eventemitter3';

const StateProgress = {
  START: -1,
  PROGRESS: 0,
  COMPLETE: 1
};

const SceneState = {
  BOOT: 'boot',
  LOAD: 'load',
  INTRO: 'intro',
  PLAYING: 'playing',
  OUTRO: 'outro'
};

const SceneStateOrder = [
  SceneState.BOOT,
  SceneState.LOAD,
  SceneState.INTRO,
  SceneState.PLAYING,
  SceneState.OUTRO,
];

export type SceneBaseProps = {
  [key: string]: unknown;
  config?: ApplicationConfig;
  cameras?: ScreenCamera[];
  screenConfigsById?:Record<string, ScreenConfig>;
  fetchProjectsResult?: FetchProjectsResult;
  addObject?: (object: SceneObject) => void;
  removeObject?: (object: SceneObject) => void;
};

class SceneBase {

  id:string;
  props:SceneBaseProps;
  cameras:ScreenCamera[] = [];
  camerasFromBottomToTop:ScreenCamera[] = [];
  screenConfigsById:Record<string, ScreenConfig> = {};
  fetchProjectsResult:FetchProjectsResult = {};
  addObject:(object: SceneObject) => void;
  removeObject:(object: SceneObject) => void;

  events = {
    stateStart: new EventEmitter(),
    stateProgress: new EventEmitter(),
    stateComplete: new EventEmitter()
  };

  config:ApplicationConfig;
  objects:SceneObject[] = [];
  stateName = SceneState.BOOT;
  targetStateName = SceneState.BOOT;
  stateProgress = StateProgress.START;

  dataSources:object[][] = [];
  dataSourcesByKey:Record<string, object[]> = {};

  constructor(id = THREE.MathUtils.generateUUID(), props:SceneBaseProps = {}) {
    const mergedProps:SceneBaseProps = {
      cameras: [],
      screenConfigsById: {},
      fetchProjectsResult: {},
      addObject: () => {},
      removeObject: () => {},
    };
    Object.assign(mergedProps, props);
    props = mergedProps;
    this.id = id;
    this.props = props;
    this.config = this.props.config;
    this.cameras = props.cameras;
    this.screenConfigsById = props.screenConfigsById;
    this.fetchProjectsResult = props.fetchProjectsResult;

    this.addObject = props.addObject;
    this.removeObject = props.removeObject;

    this.events.stateStart.on('stateStart', this.onStateStart);
    this.events.stateProgress.on('stateProgress', this.onStateProgress);
    this.events.stateComplete.on('stateComplete', this.onStateComplete);

    this.stateProgress = StateProgress.COMPLETE;

    // sort cameras from bottom to top
    this.camerasFromBottomToTop = this.cameras.sort((a, b) => {
      return (a.props.position.y < b.props.position.y) ? -1 : 1;
    });
  }

  getStateIndex(stateName:string) {
    return SceneStateOrder.indexOf(stateName);
  }

  animateToStateName(targetStateName:string) {
    this.targetStateName = targetStateName;
    // make sure all states until the target state have played out
    const currentStateIndex = SceneStateOrder.indexOf(this.stateName);
    const targetStateIndex = SceneStateOrder.indexOf(this.targetStateName);
    const stateNamesToExecute = SceneStateOrder.slice(currentStateIndex + 1, targetStateIndex + 1);
    if (stateNamesToExecute.length === 0) {
      console.log('no states to playout')
      return Promise.resolve();
    }

    // build a queue
    let animationQueue = Promise.resolve();
    for (const stateName of stateNamesToExecute) {
      animationQueue = animationQueue.then(() => {
        // is the stateName still within the target? Could be overwritten by multiple calls to animateToStateName
        const stateNameIsStillNecessaryToPlayout = (SceneStateOrder.indexOf(stateName) >= SceneStateOrder.indexOf(this.stateName)) && (SceneStateOrder.indexOf(stateName) <= SceneStateOrder.indexOf(this.targetStateName));
        if (!stateNameIsStillNecessaryToPlayout) {
          return;
        }
        this.stateName = stateName;
        this.stateProgress = StateProgress.START;
        return this._executeStateName(stateName);
      });
    }
    return animationQueue;
  }

  getIsCurrentStateStillActiveOrBefore(targetState:string) {
    return (SceneStateOrder.indexOf(this.stateName) <= SceneStateOrder.indexOf(targetState));
  }

  async _executeStateName(stateName:string) {
    console.log(stateName);
  }

  dispatchStateStartIfCurrentStateMatches(stateName:string) {
    if (this.stateName === stateName) {
      this.events.stateStart.emit('stateStart', stateName);
      return true;
    }
    return false;
  }

  dispatchStateProgressIfCurrentStateMatches(stateName:string, stateProgress:number) {
    if (this.stateName === stateName) {
      this.events.stateProgress.emit('stateProgress', stateName, stateProgress);
      return true;
    }
    return false;
  }

  dispatchStateCompleteIfCurrentStateMatches(stateName:string) {
    if (this.stateName === stateName) {
      this.events.stateComplete.emit('stateComplete', stateName);
      return true;
    }
    return false;
  }

  onStateStart(stateName:string) {
    console.log(this, stateName);
  }
  onStateProgress(stateName:string, progress:number) {
    console.log(this, stateName, progress);
  }
  onStateComplete(stateName:string) {
    console.log(this, stateName);
  }

  render() {
  }

  dispose() {
    this.events.stateStart.removeAllListeners();
    this.events.stateProgress.removeAllListeners();
    this.events.stateComplete.removeAllListeners();
  }

  createDataSourcesForThisScene(dataRoot:unknown, sceneConfig:SceneConfig) {
    this.dataSources = [];
    this.dataSourcesByKey = {};
    if (sceneConfig?.objects?.length > 0) {
      for (let objectConfigIndex = 0; objectConfigIndex < sceneConfig.objects.length; objectConfigIndex++) {
        const objectConfig = sceneConfig.objects[objectConfigIndex];
        if (!objectConfig.dataSource) {
          continue;
        }
        if (!('key' in objectConfig.dataSource)) {
          continue;
        }
        if (this.dataSourcesByKey[objectConfig.dataSource.key]) {
          continue;
        }
        let data = getValueByPath(dataRoot, objectConfig.dataSource.key);
        if (!data) {
          continue;
        }
        if (!Array.isArray(data)) {
          data = [data];
        }
        let dataArray = data as object[];
        if (objectConfig.dataSource.flatten === true) {
          dataArray = dataArray.flat();
        }
        this.dataSources.push(dataArray);
        this.dataSourcesByKey[objectConfig.dataSource.key] = dataArray;
      }
    }
  }
}

export { SceneBase, SceneState, SceneStateOrder, StateProgress };
