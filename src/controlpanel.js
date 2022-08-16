import { EditorApplication } from './js/classes/EditorApplication.js';

let application;

const init = async () => {
  const config = await loadConfig();
  application = new EditorApplication(config);
  await application.init();
};

const loadConfig = async () => {
  return await (await fetch('config.json')).json();
};

init();