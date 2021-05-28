import * as THREE from '../../three.js/build/three.module.js';

const Signal = signals.Signal;

const StateProgress = {
  START: -1,
  PROGRESS: 0,
  COMPLETE: 1
};

const SceneState = {
  LOAD: 'load',
  INTRO: 'intro',
  PLAYING: 'playing',
  OUTRO: 'outro'
};

const SceneStateOrder = [
  SceneState.LOAD,
  SceneState.INTRO,
  SceneState.PLAYING,
  SceneState.OUTRO,
];

class SceneBase {
  constructor() {
    this.stateName = SceneState.LOAD;
    this.stateProgress = StateProgress.START;

    this.signals = {
      stateStart: new Signal(),
      stateProgress: new Signal(),
      stateComplete: new Signal()
    };

    this.signals.stateStart.add(this.onStateStart);
    this.signals.stateProgress.add(this.onStateProgress);
    this.signals.stateComplete.add(this.onStateComplete);
  }

  load() {
    this.stateName = SceneState.LOAD;
    this.stateProgress = StateProgress.START;
  }

  getStateIndex(stateName) {
    return SceneStateOrder.indexOf(stateName);
  }

  animateToStateName(targetStateName) {
  }

  dispatchStateStart() {
    this.signals.stateStart.dispatch(this.stateName);
  }

  dispatchStateProgress() {
    this.signals.stateProgress.dispatch(this.stateName, this.stateProgress);
  }

  dispatchStateComplete() {
    this.signals.stateComplete.dispatch(this.stateName);
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
}

export { SceneBase, StateProgress, SceneState, SceneStateOrder };