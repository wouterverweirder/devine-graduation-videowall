import { getValueByPath } from '../../functions/getValueByPath.js';
import * as THREE from '../../three.js/build/three.module.js';

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

class SceneBase {

  config = {};
  objects = [];
  stateName = SceneState.BOOT;
  targetStateName = SceneState.BOOT;
  stateProgress = StateProgress.START;

  constructor(id = THREE.MathUtils.generateUUID(), props = {}) {
    const mergedProps = {
      config: {},
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

    const Signal = window.signals.Signal;

    this.signals = {
      stateStart: new Signal(),
      stateProgress: new Signal(),
      stateComplete: new Signal()
    };

    this.signals.stateStart.add(this.onStateStart, this);
    this.signals.stateProgress.add(this.onStateProgress, this);
    this.signals.stateComplete.add(this.onStateComplete, this);

    this.stateProgress = StateProgress.COMPLETE;

    // sort cameras from bottom to top
    this.camerasFromBottomToTop = this.cameras.sort((a, b) => {
      return (a.props.position.y < b.props.position.y) ? -1 : 1;
    });
  }

  // load() {
  //   this.stateName = SceneState.LOAD;
  //   this.stateProgress = StateProgress.START;
  //   this.dispatchStateStartIfCurrentStateMatches(this.stateName);
  // }

  getStateIndex(stateName) {
    return SceneStateOrder.indexOf(stateName);
  }

  animateToStateName(targetStateName) {
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

  getIsCurrentStateStillActiveOrBefore(targetState) {
    return (SceneStateOrder.indexOf(this.stateName) <= SceneStateOrder.indexOf(targetState));
  }

  async _executeStateName(stateName) {
    console.log(stateName);
  }

  dispatchStateStartIfCurrentStateMatches(stateName) {
    if (this.stateName === stateName) {
      this.signals.stateStart.dispatch(stateName);
      return true;
    }
    return false;
  }

  dispatchStateProgressIfCurrentStateMatches(stateName, stateProgress) {
    if (this.stateName === stateName) {
      this.signals.stateProgress.dispatch(stateName, stateProgress);
      return true;
    }
    return false;
  }

  dispatchStateCompleteIfCurrentStateMatches(stateName) {
    if (this.stateName === stateName) {
      this.signals.stateComplete.dispatch(stateName);
      return true;
    }
    return false;
  }

  onStateStart(stateName) {
    console.log(this, stateName);
  }
  onStateProgress(stateName, progress) {
    console.log(this, stateName, progress);
  }
  onStateComplete(stateName) {
    console.log(this, stateName);
  }

  render() {
  }

  dispose() {
    this.signals.stateStart.removeAll();
    this.signals.stateProgress.removeAll();
    this.signals.stateComplete.removeAll();
  }

  createDataSourcesForThisScene(dataRoot, sceneConfig) {
    this.dataSources = [];
    this.dataSourcesByKey = {};
    if (sceneConfig?.objects?.length > 0) {
      for (let objectConfigIndex = 0; objectConfigIndex < sceneConfig.objects.length; objectConfigIndex++) {
        const objectConfig = sceneConfig.objects[objectConfigIndex];
        if (!objectConfig.dataSource) {
          continue;
        }
        if (!objectConfig.dataSource.key) {
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
        if (objectConfig.dataSource.flatten === true) {
          data = data.flat();
        }
        // tmp
        // if (objectConfig.dataSource.key === "projects.[].students.[].profilePicture") { 
        //   console.log('students')
        //   // limit to 13 items
        //   data = data.slice(0, 13);
        // }
        // end tmp
        this.dataSources.push(data);
        this.dataSourcesByKey[objectConfig.dataSource.key] = data;
      }
    }
  }
}

export { SceneBase, StateProgress, SceneState, SceneStateOrder };