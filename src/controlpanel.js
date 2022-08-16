import { EditorApplication } from './js/classes/EditorApplication.js';

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
  const config = await loadConfig();
  application = new EditorApplication(config);
  await application.init();
};

const loadConfig = async () => {
  return await (await fetch('config.json')).json();
};

init();