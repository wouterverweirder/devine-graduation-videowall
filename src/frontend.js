import { ProjectorApplication } from './js/classes/ProjectorApplication.js';
import './js/offscreencanvas.polyfill.js';
import { getArgVFromQueryString } from './options.js';

let application;

const init = async () => {
  // hack to get signals working
  if (!(typeof module!=="undefined")) {
    window.module = {
      exports: {}
    }
    await import('./js/three.js/editor/js/libs/signals.min.js');
    window.signals = window.module.exports;
    delete window.module;
  } else {
    const result = await import('./js/three.js/editor/js/libs/signals.min.js');
    window.signals = result.default;
  }
  // end hack to get signals working

  const argv = getArgVFromQueryString();
  const config = await (await fetch(argv['config-json-path'])).json();
  application = new ProjectorApplication(config);
  await application.init();
};

init();