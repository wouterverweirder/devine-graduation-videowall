import { ProjectorApplication } from './js/classes/ProjectorApplication.js';

let application;

const init = async () => {
  const config = await loadConfig();
  application = new ProjectorApplication(config);
  await application.init();
};

const loadConfig = async () => {
  return await (await fetch('config.json')).json();
};

init();